import { format, startOfDay } from 'date-fns';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Label } from './ui/label';
import { TypographySmall } from './ui/typography';

function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number,
): Date {
  const d = new Date(year, month, 1);
  const first = (weekday - d.getDay() + 7) % 7;
  return new Date(year, month, 1 + first + (n - 1) * 7);
}

function lastWeekday(year: number, month: number, weekday: number): Date {
  const d = new Date(year, month + 1, 0);
  const diff = (d.getDay() - weekday + 7) % 7;
  return new Date(year, month, d.getDate() - diff);
}

function getFederalHolidays(year: number): { name: string; date: Date }[] {
  return [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: 'MLK Day', date: nthWeekday(year, 0, 1, 3) },
    { name: "Presidents' Day", date: nthWeekday(year, 1, 1, 3) },
    { name: 'Memorial Day', date: lastWeekday(year, 4, 1) },
    { name: 'Juneteenth', date: new Date(year, 5, 19) },
    { name: 'Independence Day', date: new Date(year, 6, 4) },
    { name: 'Labor Day', date: nthWeekday(year, 8, 1, 1) },
    { name: 'Columbus Day', date: nthWeekday(year, 9, 1, 2) },
    { name: 'Veterans Day', date: new Date(year, 10, 11) },
    { name: 'Thanksgiving', date: nthWeekday(year, 10, 4, 4) },
    { name: 'Christmas Eve', date: new Date(year, 11, 24) },
    { name: 'Christmas', date: new Date(year, 11, 25) },
  ];
}

function HolidayChip({
  date,
  onRemove,
}: {
  readonly date: Date;
  readonly onRemove: (date: Date) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
      {format(date, 'MMM d')}
      <button
        onClick={() => onRemove(date)}
        aria-label={`Remove ${format(date, 'MMM d')}`}
        className="ml-0.5 p-1 transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export interface HolidayPickerProps {
  readonly holidays: Date[];
  readonly onChange: (holidays: Date[]) => void;
}

export function HolidayPicker({
  holidays,
  onChange,
}: Readonly<HolidayPickerProps>) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const today = startOfDay(new Date());
  const year = today.getFullYear();
  const remainingFederalHolidays = getFederalHolidays(year).filter(
    ({ date }) => startOfDay(date) >= today,
  );

  function addHoliday(date: Date | undefined) {
    if (!date) return;
    if (!holidays.some((d) => d.getTime() === date.getTime())) {
      onChange([...holidays, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  }

  function removeHoliday(date: Date) {
    onChange(holidays.filter((d) => d.getTime() !== date.getTime()));
  }

  function toggleFederalHoliday(date: Date) {
    if (holidays.some((d) => d.getTime() === date.getTime())) {
      removeHoliday(date);
    } else {
      addHoliday(date);
    }
  }

  function addAllFederalHolidays() {
    const merged = [...holidays];
    for (const { date } of remainingFederalHolidays) {
      if (!merged.some((d) => d.getTime() === date.getTime())) {
        merged.push(date);
      }
    }
    onChange(merged.toSorted((a, b) => a.getTime() - b.getTime()));
  }

  const holidayCountLabel =
    holidays.length > 0
      ? `${holidays.length} holiday${holidays.length > 1 ? 's' : ''} selected`
      : 'Click to add holidays';

  const allFederalAdded =
    remainingFederalHolidays.length > 0 &&
    remainingFederalHolidays.every(({ date }) =>
      holidays.some((d) => d.getTime() === date.getTime()),
    );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={calendarOpen}
        aria-controls="holiday-calendar-panel"
        onClick={() => setCalendarOpen((o) => !o)}
        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
      >
        <div>
          <Label className="pointer-events-none text-sm font-medium">
            Company holidays this year
          </Label>
          <TypographySmall className="text-muted-foreground font-normal block mt-0.5">
            {holidayCountLabel}
          </TypographySmall>
        </div>
        {calendarOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {calendarOpen && (
        <div
          id="holiday-calendar-panel"
          className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm -mt-1"
        >
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <TypographySmall className="font-semibold text-foreground">
                Upcoming US Federal Holidays
              </TypographySmall>
              {!allFederalAdded && (
                <button
                  type="button"
                  onClick={addAllFederalHolidays}
                  className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
                >
                  Add all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {remainingFederalHolidays.map(({ name, date }) => {
                const selected = holidays.some(
                  (d) => d.getTime() === date.getTime(),
                );
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleFederalHoliday(date)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {name}
                    <span
                      className={`text-[10px] ${selected ? 'opacity-75' : 'text-muted-foreground'}`}
                    >
                      {format(date, 'M/d')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-px bg-border/60 mx-4" />

          <Calendar
            mode="single"
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            onSelect={(date) => addHoliday(date)}
            disabled={(date) =>
              holidays.some((d) => d.getTime() === date.getTime())
            }
            className="w-full"
          />

          {holidays.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border/60 bg-muted/20 px-4 py-3">
              {holidays.map((date) => (
                <HolidayChip
                  key={date.toISOString()}
                  date={date}
                  onRemove={removeHoliday}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
