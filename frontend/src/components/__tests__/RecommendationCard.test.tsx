import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecommendationCard } from '../RecommendationCard';
import type { TripRecommendation } from '@/types/types';

const mockRec: TripRecommendation = {
  rank: 1,
  start_date: '2026-09-05',
  end_date: '2026-09-08',
  total_days_off: 4,
  pto_days_used: 1,
  yield_score: 4,
  best_flight: {
    airline: 'Asiana Airlines',
    estimated_flight_cost: 1078,
    layovers: 1,
    departs_at: '2026-09-05T01:30:00',
    returns_at: '2026-09-06T10:50:00',
  },
  reasoning: 'This window has the lowest estimated flight cost.',
};

describe('RecommendationCard', () => {
  it('renders the date range', () => {
    render(<RecommendationCard rec={mockRec} />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('Sep 5');
    expect(heading).toHaveTextContent('Sep 8, 2026');
  });

  it('renders the flight cost', () => {
    render(<RecommendationCard rec={mockRec} />);
    expect(screen.getByText('$1,078')).toBeInTheDocument();
  });

  it('renders the airline name', () => {
    render(<RecommendationCard rec={mockRec} />);
    expect(screen.getByText('Asiana Airlines')).toBeInTheDocument();
  });

  it('renders the correct rank badge', () => {
    render(<RecommendationCard rec={mockRec} />);
    expect(screen.getByText('1st pick')).toBeInTheDocument();
  });

  it('renders stop count as "1 stop"', () => {
    render(<RecommendationCard rec={mockRec} />);
    expect(screen.getByText('1 stop')).toBeInTheDocument();
  });

  it('renders "Nonstop" when layovers is 0', () => {
    const nonstop = {
      ...mockRec,
      best_flight: { ...mockRec.best_flight, layovers: 0 },
    };
    render(<RecommendationCard rec={nonstop} />);
    expect(screen.getByText('Nonstop')).toBeInTheDocument();
  });

  it('renders the reasoning text', () => {
    render(<RecommendationCard rec={mockRec} />);
    expect(screen.getByText(mockRec.reasoning)).toBeInTheDocument();
  });

  it('renders PTO and days off stats', () => {
    render(<RecommendationCard rec={mockRec} />);
    expect(screen.getByText('1 PTO used')).toBeInTheDocument();
    expect(screen.getByText('4 days off')).toBeInTheDocument();
  });
});
