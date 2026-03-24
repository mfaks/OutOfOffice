import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RecommendationCard } from '../components/RecommendationCard';
import type { TripRecommendation } from '../types/types';

const REC: TripRecommendation = {
  rank: 1,
  start_date: '2026-07-04',
  end_date: '2026-07-08',
  total_days_off: 5,
  pto_days_used: 3,
  yield_score: 1.67,
  best_flight: {
    airline: 'Delta',
    estimated_flight_cost: 450,
    layovers: 0,
    departs_at: '2026-07-04T08:00:00',
    returns_at: '2026-07-08T18:00:00',
  },
  reasoning: 'Great summer timing with low cost.',
};

describe('RecommendationCard', () => {
  it('renders date range', () => {
    render(<RecommendationCard rec={REC} />);
    // "Jul 4" appears in both the heading and the departs row; match the h3 specifically
    expect(
      screen.getByRole('heading', { name: /jul 4.*jul 8/i }),
    ).toBeInTheDocument();
  });

  it('renders flight cost', () => {
    render(<RecommendationCard rec={REC} />);
    expect(screen.getByText('$450')).toBeInTheDocument();
  });

  it('renders airline name', () => {
    render(<RecommendationCard rec={REC} />);
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });

  it('renders nonstop label when layovers is 0', () => {
    render(<RecommendationCard rec={REC} />);
    expect(screen.getByText(/nonstop/i)).toBeInTheDocument();
  });

  it('renders stop count when layovers > 0', () => {
    const rec = { ...REC, best_flight: { ...REC.best_flight, layovers: 1 } };
    render(<RecommendationCard rec={rec} />);
    expect(screen.getByText(/1 stop/i)).toBeInTheDocument();
  });

  it('renders AI reasoning text', () => {
    render(<RecommendationCard rec={REC} />);
    expect(screen.getByText(/great summer timing/i)).toBeInTheDocument();
  });

  it('renders rank badge', () => {
    render(<RecommendationCard rec={REC} />);
    expect(screen.getByText(/1st pick/i)).toBeInTheDocument();
  });

  it('does not render search on kayak link when searchUrl is not provided', () => {
    render(<RecommendationCard rec={REC} />);
    expect(
      screen.queryByRole('link', { name: /search on kayak/i }),
    ).not.toBeInTheDocument();
  });

  it('renders search on kayak link when searchUrl is provided', () => {
    render(
      <RecommendationCard rec={REC} searchUrl="https://example.com/flights" />,
    );
    const link = screen.getByRole('link', { name: /search on kayak/i });
    expect(link).toBeInTheDocument();
  });

  it('search on kayak link has correct href', () => {
    const url = 'https://example.com/flights';
    render(<RecommendationCard rec={REC} searchUrl={url} />);
    const link = screen.getByRole('link', { name: /search on kayak/i });
    expect(link).toHaveAttribute('href', url);
  });

  it('search on kayak link opens in new tab', () => {
    render(<RecommendationCard rec={REC} searchUrl="https://example.com" />);
    const link = screen.getByRole('link', { name: /search on kayak/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render save trip button when onSave is not provided', () => {
    render(<RecommendationCard rec={REC} />);
    expect(
      screen.queryByRole('button', { name: /save trip/i }),
    ).not.toBeInTheDocument();
  });

  it('renders save trip button when onSave is provided', () => {
    render(<RecommendationCard rec={REC} onSave={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /save trip/i }),
    ).toBeInTheDocument();
  });

  it('calls onSave when save trip button is clicked', async () => {
    const onSave = vi.fn();
    render(<RecommendationCard rec={REC} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /save trip/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables save trip button when isSaving is true', () => {
    render(<RecommendationCard rec={REC} onSave={vi.fn()} isSaving />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows saved state and disables button when isSaved is true', () => {
    render(<RecommendationCard rec={REC} onSave={vi.fn()} isSaved />);
    const btn = screen.getByRole('button', { name: /saved/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });
});
