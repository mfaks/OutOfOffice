import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Account from '../components/Account';
import { AuthProvider } from '../context/AuthContext';
import type { SavedTripListRead } from '../types/types';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderAccount(initialAuth?: { token: string; email: string }) {
  if (initialAuth) {
    localStorage.setItem('hermes_auth', JSON.stringify(initialAuth));
  }
  return render(
    <QueryClientProvider client={makeClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/account']}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/account" element={<Account />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const EMPTY_PREFS = {
  pto_days_remaining: null,
  max_flight_budget: null,
  default_departure: null,
  default_destination: null,
  company_holidays: [],
  preferred_months: [],
};

const EMPTY_TRIPS: SavedTripListRead = { trips: [], pto_days_remaining: null };

function mockFetch(
  prefsBody = EMPTY_PREFS,
  tripsBody: SavedTripListRead = EMPTY_TRIPS,
) {
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    const u = String(url);
    if (u.includes('/me/trips')) {
      return Promise.resolve(
        new Response(JSON.stringify(tripsBody), { status: 200 }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(prefsBody), { status: 200 }),
    );
  });
}

beforeEach(() => {
  localStorage.clear();
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('Account', () => {
  it('redirects to home when user is not authenticated', async () => {
    renderAccount(); // no auth
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('renders account heading when authenticated', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /account/i }),
      ).toBeInTheDocument();
    });
  });

  it('displays user email', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('renders departure and destination inputs', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(
        screen.getByLabelText(/default departure airport/i),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/default destination airport/i),
      ).toBeInTheDocument();
    });
  });

  it('renders PTO and budget inputs', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByLabelText(/pto days remaining/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max flight budget/i)).toBeInTheDocument();
    });
  });

  it('pre-populates fields from fetched preferences', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          pto_days_remaining: 10,
          max_flight_budget: 800,
          default_departure: 'JFK',
          default_destination: 'NRT',
          company_holidays: [],
          preferred_months: [],
        }),
        { status: 200 },
      ),
    );
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByDisplayValue('JFK')).toBeInTheDocument();
      expect(screen.getByDisplayValue('NRT')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });
  });

  it('renders all 12 month toggle buttons', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Jan' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Dec' })).toBeInTheDocument();
    });
  });

  it('clicking a month button selects it', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => screen.getByRole('button', { name: 'Jun' }));
    const junBtn = screen.getByRole('button', { name: 'Jun' });
    await userEvent.click(junBtn);
    expect(junBtn).toHaveClass('bg-primary');
  });

  it('clicking a selected month deselects it', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => screen.getByRole('button', { name: 'Jul' }));
    const julBtn = screen.getByRole('button', { name: 'Jul' });
    await userEvent.click(julBtn);
    await userEvent.click(julBtn);
    expect(julBtn).not.toHaveClass('bg-primary');
  });

  it('save button calls PUT /me/preferences', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/me/trips')) {
        return Promise.resolve(
          new Response(JSON.stringify(EMPTY_TRIPS), { status: 200 }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify(EMPTY_PREFS), { status: 200 }),
      );
    });
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() =>
      screen.getByRole('button', { name: /save preferences/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save preferences/i }),
    );
    const putCall = fetchSpy.mock.calls.find(
      ([url, opts]) =>
        typeof url === 'string' &&
        url.includes('/me/preferences') &&
        (opts as RequestInit)?.method === 'PUT',
    );
    expect(putCall).toBeDefined();
  });

  it('renders saved trips section heading', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /saved trips/i }),
      ).toBeInTheDocument();
    });
  });

  it('shows "No saved trips yet" when trip list is empty', async () => {
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText(/no saved trips yet/i)).toBeInTheDocument();
    });
  });

  it('renders saved trip rows when trips exist', async () => {
    mockFetch(EMPTY_PREFS, {
      trips: [
        {
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
        },
      ],
      pto_days_remaining: 7,
    });
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => {
      expect(screen.getByText(/JFK → CDG/)).toBeInTheDocument();
    });
  });

  it('delete button calls DELETE /me/trips/:id', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation((url, opts) => {
        const u = String(url);
        if (
          u.includes('/me/trips') &&
          (opts as RequestInit)?.method === 'DELETE'
        ) {
          return Promise.resolve(new Response(null, { status: 204 }));
        }
        if (u.includes('/me/trips')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                trips: [
                  {
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
                  },
                ],
                pto_days_remaining: 7,
              }),
              { status: 200 },
            ),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(EMPTY_PREFS), { status: 200 }),
        );
      });
    renderAccount({ token: 'tok', email: 'user@example.com' });
    await waitFor(() => screen.getByText(/JFK → CDG/));
    const deleteBtn = screen.getByRole('button', { name: '' }); // Trash2 icon button
    await userEvent.click(deleteBtn);
    const deleteCall = fetchSpy.mock.calls.find(
      ([url, opts]) =>
        typeof url === 'string' &&
        url.includes('/me/trips/1') &&
        (opts as RequestInit)?.method === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
  });
});
