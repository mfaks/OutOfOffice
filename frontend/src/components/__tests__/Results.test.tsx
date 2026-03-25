import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Results from '../Results';
import type { TripPlannerResponse } from '@/types/types';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockResponse: TripPlannerResponse = {
  thread_id: 'test-thread-123',
  request: {
    departure: 'JFK',
    destination: 'CDG',
    pto_days_remaining: 5,
    max_flight_budget: 1000,
  },
  recommendations: [
    {
      rank: 1,
      start_date: '2026-05-23',
      end_date: '2026-05-26',
      total_days_off: 4,
      pto_days_used: 2,
      yield_score: 2.0,
      best_flight: {
        airline: 'Air France',
        estimated_flight_cost: 650,
        layovers: 0,
        outbound_departs_at: '2026-05-23T08:00:00',
        outbound_arrives_at: '2026-05-23T14:00:00',
        return_departs_at: '2026-05-26T18:00:00',
        return_arrives_at: '2026-05-26T22:00:00',
      },
      reasoning: 'Good yield score and cheap direct flight.',
      itinerary: [],
    },
  ],
  generated_at: '2026-03-21T00:00:00Z',
};

function renderWithState(state: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/results', state }]}>
      <Results />
    </MemoryRouter>,
  );
}

describe('Results', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.unstubAllGlobals();
  });

  it('redirects to / when there is no response state', () => {
    renderWithState({});
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('renders the departure and destination', () => {
    renderWithState({ response: mockResponse });
    expect(screen.getByText('JFK')).toBeInTheDocument();
    expect(screen.getByText('CDG')).toBeInTheDocument();
  });

  it('renders a recommendation card', () => {
    renderWithState({ response: mockResponse });
    expect(screen.getByText('Air France')).toBeInTheDocument();
  });

  it('renders the feedback input and Refine button', () => {
    renderWithState({ response: mockResponse });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refine' })).toBeInTheDocument();
  });

  it('Refine button is disabled when input is empty', () => {
    renderWithState({ response: mockResponse });
    expect(screen.getByRole('button', { name: 'Refine' })).toBeDisabled();
  });

  it('calls feedback API and updates recommendations on submit', async () => {
    const updatedResponse: TripPlannerResponse = {
      ...mockResponse,
      recommendations: [
        {
          ...mockResponse.recommendations[0],
          best_flight: {
            ...mockResponse.recommendations[0].best_flight,
            airline: 'EasyJet',
            estimated_flight_cost: 200,
          },
          reasoning: 'Cheaper option found.',
          itinerary: [],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedResponse),
      }),
    );

    renderWithState({ response: mockResponse });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'find cheaper options' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }));

    await waitFor(() => {
      expect(screen.getByText('EasyJet')).toBeInTheDocument();
    });
  });

  it('calls the correct feedback URL with thread_id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithState({ response: mockResponse });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'too expensive' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          'http://localhost:8000/trips/test-thread-123/feedback',
        ),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
