import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TripDetail from '../components/TripDetail';
import { AuthProvider } from '../context/AuthContext';

const SAVED_TRIP = {
  id: 1,
  departure: 'JFK',
  destination: 'CDG',
  start_date: '2026-07-04',
  end_date: '2026-07-08',
  pto_days_used: 3,
  total_days_off: 5,
  recommendation: {
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
    reasoning: 'Great timing.',
  },
  saved_at: '2026-03-01T00:00:00',
};

const PREFS = {
  pto_days_remaining: 7,
  max_flight_budget: null,
  default_departure: null,
  default_destination: null,
  company_holidays: [],
  preferred_months: [],
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderTripDetail(
  tripId = '1',
  auth?: { token: string; email: string },
) {
  if (auth) {
    localStorage.setItem('hermes_auth', JSON.stringify(auth));
  }
  return render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/trips/${tripId}`]}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/account" element={<div>Account</div>} />
            <Route path="/trips/:tripId" element={<TripDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    const u = String(url);
    if (u.includes('/me/trips/')) {
      return Promise.resolve(
        new Response(JSON.stringify(SAVED_TRIP), { status: 200 }),
      );
    }
    if (u.includes('/me/preferences')) {
      return Promise.resolve(
        new Response(JSON.stringify(PREFS), { status: 200 }),
      );
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('TripDetail', () => {
  it('redirects to home when unauthenticated', async () => {
    renderTripDetail('1');
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('renders departure and destination', async () => {
    renderTripDetail('1', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText('JFK')).toBeInTheDocument();
      expect(screen.getByText('CDG')).toBeInTheDocument();
    });
  });

  it('renders recommendation card with airline', async () => {
    renderTripDetail('1', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Delta')).toBeInTheDocument();
    });
  });

  it('renders updated PTO balance from preferences', async () => {
    renderTripDetail('1', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText(/7 PTO days remaining/)).toBeInTheDocument();
    });
  });

  it('renders remove trip button', async () => {
    renderTripDetail('1', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /remove trip/i }),
      ).toBeInTheDocument();
    });
  });

  it('shows confirmation prompt after clicking remove trip', async () => {
    renderTripDetail('1', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => screen.getByRole('button', { name: /remove trip/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove trip/i }));
    expect(
      screen.getByRole('button', { name: /yes, remove/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls DELETE and navigates to account on confirm', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation((url, opts) => {
        const u = String(url);
        if (
          u.includes('/me/trips/') &&
          (opts as RequestInit)?.method === 'DELETE'
        ) {
          return Promise.resolve(new Response(null, { status: 204 }));
        }
        if (u.includes('/me/trips/')) {
          return Promise.resolve(
            new Response(JSON.stringify(SAVED_TRIP), { status: 200 }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(PREFS), { status: 200 }),
        );
      });
    renderTripDetail('1', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => screen.getByRole('button', { name: /remove trip/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove trip/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, remove/i }));
    const deleteCall = fetchSpy.mock.calls.find(
      ([url, opts]) =>
        typeof url === 'string' &&
        url.includes('/me/trips/1') &&
        (opts as RequestInit)?.method === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  it('renders "Trip not found" on 404', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/me/trips/')) {
        return Promise.resolve(new Response('{}', { status: 404 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify(PREFS), { status: 200 }),
      );
    });
    renderTripDetail('999', { token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText(/trip not found/i)).toBeInTheDocument();
    });
  });
});
