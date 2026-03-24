import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { SavedTripListRead, UserPreferences } from '@/types/types';
import { HolidayPicker } from './HolidayPicker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TypographyH1, TypographyMuted } from './ui/typography';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function Account() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [pto, setPto] = useState('');
  const [budget, setBudget] = useState('');
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [preferredMonths, setPreferredMonths] = useState<number[]>([]);
  const prefsApplied = useRef(false);

  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  const { data: prefs } = useQuery<UserPreferences>({
    queryKey: ['preferences'],
    enabled: !!token,
    queryFn: () =>
      fetch('http://localhost:8000/me/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
  });

  useEffect(() => {
    if (!prefs || prefsApplied.current) return;
    prefsApplied.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeparture(prefs.default_departure ?? '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDestination(prefs.default_destination ?? '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPto(
      prefs.pto_days_remaining != null ? String(prefs.pto_days_remaining) : '',
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBudget(
      prefs.max_flight_budget != null ? String(prefs.max_flight_budget) : '',
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHolidays(
      prefs.company_holidays.map((s) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
      }),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferredMonths(prefs.preferred_months);
  }, [prefs]);

  const { data: savedTripsData } = useQuery<SavedTripListRead>({
    queryKey: ['saved-trips'],
    enabled: !!token,
    queryFn: () =>
      fetch('http://localhost:8000/me/trips', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
  });

  const { mutate: deleteTrip } = useMutation({
    mutationFn: (tripId: number) =>
      fetch(`http://localhost:8000/me/trips/${tripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to delete');
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      queryClient.invalidateQueries({ queryKey: ['saved-trips'] });
      toast.success('Trip removed — PTO days restored');
    },
    onError: () => toast.error('Failed to remove trip. Please try again.'),
  });

  const { mutate: savePrefs, isPending } = useMutation({
    mutationFn: (body: UserPreferences) =>
      fetch('http://localhost:8000/me/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to save');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences saved');
    },
    onError: () => toast.error('Failed to save preferences. Please try again.'),
  });

  function handleSave() {
    savePrefs({
      pto_days_remaining: pto ? Number(pto) : null,
      max_flight_budget: budget ? Number(budget.replace(/[^0-9.]/g, '')) : null,
      default_departure: departure.trim() || null,
      default_destination: destination.trim() || null,
      company_holidays: holidays.map((d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }),
      preferred_months: preferredMonths,
    });
  }

  function toggleMonth(m: number) {
    setPreferredMonths((prev) =>
      prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m].sort((a, b) => a - b),
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <TypographyH1 className="text-2xl mb-1">Account</TypographyH1>
        <TypographyMuted className="mb-8">{user.email}</TypographyMuted>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col gap-5">
            <h2 className="text-base font-semibold text-foreground">
              Trip defaults
            </h2>
            <p className="text-sm text-muted-foreground -mt-3">
              These values pre-fill the trip planner form when you open it.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-departure">Default departure airport</Label>
                <Input
                  id="acc-departure"
                  placeholder="e.g. JFK"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-destination">
                  Default destination airport
                </Label>
                <Input
                  id="acc-destination"
                  placeholder="e.g. NRT"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-pto">PTO days remaining</Label>
                <Input
                  id="acc-pto"
                  type="number"
                  placeholder="e.g. 10"
                  min={1}
                  value={pto}
                  onChange={(e) => setPto(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-budget">Max flight budget</Label>
                <Input
                  id="acc-budget"
                  placeholder="e.g. $800"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">
              Company holidays
            </h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Days your company has off that will be treated as free days in PTO
              calculations.
            </p>
            <HolidayPicker holidays={holidays} onChange={setHolidays} />
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">
              Preferred travel months
            </h2>
            <p className="text-sm text-muted-foreground -mt-2">
              The planner will prioritize trip windows in these months. Leave
              empty to consider all months.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MONTHS.map((name, i) => {
                const m = i + 1;
                const selected = preferredMonths.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">
              Saved trips
            </h2>
            {!savedTripsData ? (
              <TypographyMuted className="text-sm">Loading…</TypographyMuted>
            ) : savedTripsData.trips.length === 0 ? (
              <TypographyMuted className="text-sm">
                No saved trips yet.
              </TypographyMuted>
            ) : (
              <ul className="flex flex-col gap-3">
                {savedTripsData.trips.map((trip) => (
                  <li
                    key={trip.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-background px-4 py-3"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {trip.departure} → {trip.destination}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(trip.start_date), 'MMM d')} –{' '}
                        {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                        {' · '}
                        {trip.pto_days_used} PTO days
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteTrip(trip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Button size="lg" disabled={isPending} onClick={handleSave}>
            {isPending ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Account;
