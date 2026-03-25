import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type {
  TripPlannerRequest,
  TripPlannerResponse,
  TripPriority,
} from '@/types/types';
import { HolidayPicker } from './HolidayPicker';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TypographyMuted, TypographySmall } from './ui/typography';

const PRIORITIES: {
  value: TripPriority;
  label: string;
  description: string;
}[] = [
  {
    value: 'best_yield',
    label: 'Best yield',
    description: 'Most days off per PTO day',
  },
  {
    value: 'lowest_cost',
    label: 'Lowest cost',
    description: 'Cheapest flights first',
  },
  { value: 'most_pto', label: 'Most time off', description: 'Longest trips' },
  {
    value: 'least_pto',
    label: 'Fewest PTO days',
    description: 'Minimal PTO commitment',
  },
];

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

export function TripPlannerDialog({
  triggerClassName,
  triggerLabel = '✈️ Get Started',
}: {
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const navigate = useNavigate();

  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [pto, setPto] = useState('');
  const [budget, setBudget] = useState('');
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [preferredMonths, setPreferredMonths] = useState<number[]>([]);
  const [priority, setPriority] = useState<TripPriority>('best_yield');
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);

  async function handleSubmit() {
    if (!departure.trim() || !destination.trim() || !pto) return;
    const body: TripPlannerRequest = {
      departure: departure.trim(),
      destination: destination.trim(),
      pto_days_remaining: Math.floor(Number(pto)),
      max_flight_budget: budget
        ? Number(budget.replace(/[^0-9.]/g, ''))
        : undefined,
      company_holidays: holidays.map((d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }),
      preferred_months:
        preferredMonths.length > 0 ? preferredMonths : undefined,
      priority,
    };
    setIsPending(true);
    setIsError(false);
    try {
      const res = await fetch('http://localhost:8000/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Request failed');
      const response: TripPlannerResponse = await res.json();
      navigate('/results', { state: { response } });
    } catch {
      setIsError(true);
    } finally {
      setIsPending(false);
    }
  }

  function handleReset() {
    setDeparture('');
    setDestination('');
    setPto('');
    setBudget('');
    setHolidays([]);
    setPreferredMonths([]);
    setPriority('best_yield');
  }

  function toggleMonth(m: number) {
    setPreferredMonths((prev) =>
      prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m].sort((a, b) => a - b),
    );
  }

  const canSubmit = departure.trim() && destination.trim() && Number(pto) >= 1;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className={triggerClassName}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan your trip</DialogTitle>
          <TypographyMuted>
            Find the best windows to stretch your PTO.
          </TypographyMuted>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1 overflow-y-auto max-h-[65vh] pr-0.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="departure">
                Departing from <span className="text-destructive">*</span>
              </Label>
              <Input
                id="departure"
                placeholder="Airport code, e.g. JFK"
                value={departure}
                onChange={(e) => setDeparture(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination">
                Destination <span className="text-destructive">*</span>
              </Label>
              <Input
                id="destination"
                placeholder="Airport code, e.g. NRT"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pto">
                PTO days remaining <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pto"
                type="number"
                placeholder="e.g. 10"
                min={1}
                value={pto}
                onChange={(e) => setPto(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget">Max flight budget</Label>
              <Input
                id="budget"
                placeholder="e.g. $800"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Optimize for</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRIORITIES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all ${
                    priority === value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <HolidayPicker holidays={holidays} onChange={setHolidays} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Preferred travel months
              </Label>
              {preferredMonths.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPreferredMonths([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <TypographySmall className="text-muted-foreground font-normal -mt-1">
              Leave empty to consider all months.
            </TypographySmall>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {MONTHS.map((name, i) => {
                const m = i + 1;
                const selected = preferredMonths.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    className={`rounded-full border px-2 py-2 text-xs font-medium transition-all ${
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
          </div>

          {isError && (
            <TypographySmall className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive font-normal">
              Something went wrong. Please try again.
            </TypographySmall>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={handleReset}>
            Reset
          </Button>
          <Button
            className="flex-1"
            size="lg"
            disabled={isPending || !canSubmit}
            onClick={handleSubmit}
          >
            {isPending ? 'Planning…' : 'Find my trip'}{' '}
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
