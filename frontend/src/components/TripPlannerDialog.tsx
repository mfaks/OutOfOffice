import { format } from 'date-fns';
import { ArrowUpRight, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type TripStyle = 'long' | 'short';

function HolidayChip({
  date,
  onRemove,
}: {
  date: Date;
  onRemove: (date: Date) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
      {format(date, 'MMM d')}
      <button
        onClick={() => onRemove(date)}
        aria-label={`Remove ${format(date, 'MMM d')}`}
        className="ml-0.5 transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function TripPlannerDialog({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const [tripStyle, setTripStyle] = useState<TripStyle>('long');
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleReset() {
    formRef.current?.reset();
    setTripStyle('long');
    setHolidays([]);
  }

  function addHoliday(date: Date | undefined) {
    if (!date) return;
    if (!holidays.some((d) => d.getTime() === date.getTime())) {
      setHolidays((prev) =>
        [...prev, date].sort((a, b) => a.getTime() - b.getTime()),
      );
    }
  }

  function removeHoliday(date: Date) {
    setHolidays((prev) => prev.filter((d) => d.getTime() !== date.getTime()));
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className={triggerClassName}>
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan your trip</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Find the best windows to stretch your PTO.
          </p>
        </DialogHeader>

        <form ref={formRef} className="flex flex-col gap-5 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="departure">
                Departing from <span className="text-destructive">*</span>
              </Label>
              <Input
                id="departure"
                placeholder="e.g. New York, JFK..."
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination">
                Destination <span className="text-destructive">*</span>
              </Label>
              <Input
                id="destination"
                placeholder="e.g. Japan, Portugal..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pto">PTO days remaining</Label>
              <Input id="pto" type="number" placeholder="e.g. 10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget">Max flight budget</Label>
              <Input id="budget" placeholder="e.g. $800" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Trip style</Label>
            <div className="flex gap-2">
              <Button
                variant={tripStyle === 'long' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTripStyle('long')}
              >
                One long trip
              </Button>
              <Button
                variant={tripStyle === 'short' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTripStyle('short')}
              >
                A few shorter ones
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Company holidays this year</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    + Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <Calendar
                    mode="single"
                    onSelect={addHoliday}
                    disabled={(date) =>
                      holidays.some((d) => d.getTime() === date.getTime())
                    }
                  />
                  {holidays.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
                      {holidays.map((date) => (
                        <HolidayChip
                          key={date.toISOString()}
                          date={date}
                          onRemove={removeHoliday}
                        />
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            {holidays.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {holidays.map((date) => (
                  <HolidayChip
                    key={date.toISOString()}
                    date={date}
                    onRemove={removeHoliday}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Used to find windows where holidays + weekends extend your PTO.
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" size="lg" onClick={handleReset}>
            Reset
          </Button>
          <Button className="flex-1" size="lg">
            Find my trips <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
