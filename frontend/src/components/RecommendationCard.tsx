import { format, parseISO } from 'date-fns';
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Plane,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import type {
  RankConfig,
  StatPillProps,
  TripRecommendation,
} from '@/types/types';

const RANK_LABELS: Record<number, string> = {
  1: '1st pick',
  2: '2nd pick',
  3: '3rd pick',
  4: '4th pick',
  5: '5th pick',
};

const RANK_CONFIG: Record<number, RankConfig> = {
  1: {
    label: '1st pick',
    rank: '1',
    headerBg: 'bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-card',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-200',
    priceStyle: 'text-amber-600',
    accentBar: 'bg-gradient-to-b from-amber-400 to-yellow-500',
    pillBg: 'bg-white border border-amber-100 text-amber-800',
  },
  2: {
    label: '2nd pick',
    rank: '2',
    headerBg: 'bg-gradient-to-br from-primary/5 via-primary/3 to-card',
    badgeStyle: 'bg-primary/10 text-primary border border-primary/20',
    priceStyle: 'text-primary',
    accentBar: 'bg-gradient-to-b from-primary to-primary/70',
    pillBg: 'bg-white border border-primary/15 text-primary',
  },
  3: {
    label: '3rd pick',
    rank: '3',
    headerBg: 'bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-card',
    badgeStyle: 'bg-orange-100 text-orange-700 border border-orange-200',
    priceStyle: 'text-orange-600',
    accentBar: 'bg-gradient-to-b from-orange-400 to-amber-500',
    pillBg: 'bg-white border border-orange-100 text-orange-700',
  },
  4: {
    label: '4th pick',
    rank: '4',
    headerBg: 'bg-gradient-to-br from-slate-50/80 via-slate-50/40 to-card',
    badgeStyle: 'bg-slate-100 text-slate-600 border border-slate-200',
    priceStyle: 'text-slate-600',
    accentBar: 'bg-gradient-to-b from-slate-300 to-slate-400',
    pillBg: 'bg-white border border-slate-200 text-slate-600',
  },
  5: {
    label: '5th pick',
    rank: '5',
    headerBg: 'bg-gradient-to-br from-slate-50/60 via-slate-50/20 to-card',
    badgeStyle: 'bg-slate-100 text-slate-500 border border-slate-200',
    priceStyle: 'text-slate-500',
    accentBar: 'bg-gradient-to-b from-slate-200 to-slate-300',
    pillBg: 'bg-white border border-slate-200 text-slate-500',
  },
};

export function RecommendationCard({
  rec,
  searchUrl,
}: {
  rec: TripRecommendation;
  searchUrl?: string;
}) {
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const config = RANK_CONFIG[rec.rank] ?? RANK_CONFIG[3];
  const start = format(parseISO(rec.start_date), 'MMM d');
  const end = format(parseISO(rec.end_date), 'MMM d, yyyy');
  const outboundDeparts = format(
    parseISO(rec.best_flight.outbound_departs_at),
    'MMM d · h:mm a',
  );
  const outboundArrives = format(
    parseISO(rec.best_flight.outbound_arrives_at),
    'MMM d · h:mm a',
  );
  const returnDeparts = format(
    parseISO(rec.best_flight.return_departs_at),
    'MMM d · h:mm a',
  );
  const returnArrives = format(
    parseISO(rec.best_flight.return_arrives_at),
    'MMM d · h:mm a',
  );
  const stopLabel =
    rec.best_flight.layovers === 0
      ? 'Nonstop'
      : `${rec.best_flight.layovers} stop${rec.best_flight.layovers > 1 ? 's' : ''}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm hover:shadow-md transition-all duration-300 border border-border/60">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accentBar}`}
      />

      <div className={`pl-8 pr-6 pt-5 pb-5 ${config.headerBg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeStyle}`}
            >
              {RANK_LABELS[rec.rank]}
            </span>

            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {start} – {end}
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <StatPill
                pillBg={config.pillBg}
                icon={<Calendar className="h-3 w-3" />}
              >
                {rec.total_days_off} days off
              </StatPill>
              <StatPill
                pillBg={config.pillBg}
                icon={<Clock className="h-3 w-3" />}
              >
                {rec.pto_days_used} PTO used
              </StatPill>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div
              className={`text-3xl font-bold tabular-nums ${config.priceStyle}`}
            >
              ${rec.best_flight.estimated_flight_cost.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">
              est. flight cost
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/50 ml-8 mr-6" />

      <div className="pl-8 pr-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 border border-primary/15">
            <Plane className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {rec.best_flight.airline}
          </span>
          <span className="text-border">·</span>
          <span className="text-xs font-medium text-muted-foreground bg-muted border border-border/60 rounded-full px-2 py-0.5">
            {stopLabel}
          </span>
        </div>

        <div className="ml-9 flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Departs
              </div>
              <div className="text-sm font-medium text-foreground">
                {outboundDeparts}
              </div>
            </div>
            <div className="flex items-center gap-1 px-1">
              <div className="h-px w-8 bg-border" />
              <Plane className="h-3 w-3 text-muted-foreground" />
              <div className="h-px w-8 bg-border" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Arrives
              </div>
              <div className="text-sm font-medium text-foreground">
                {outboundArrives}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Returns
              </div>
              <div className="text-sm font-medium text-foreground">
                {returnDeparts}
              </div>
            </div>
            <div className="flex items-center gap-1 px-1">
              <div className="h-px w-8 bg-border" />
              <Plane className="h-3 w-3 text-muted-foreground rotate-180" />
              <div className="h-px w-8 bg-border" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Arrives
              </div>
              <div className="text-sm font-medium text-foreground">
                {returnArrives}
              </div>
            </div>
          </div>
        </div>

        {searchUrl && (
          <div className="ml-9 mt-3">
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              Search on Kayak
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <div className="h-px bg-border/50 ml-8 mr-6" />

      <div className="pl-8 pr-6 py-4 flex gap-2.5">
        <Sparkles className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
        <p className="text-sm leading-relaxed text-muted-foreground italic">
          {rec.reasoning}
        </p>
      </div>

      {rec.itinerary && rec.itinerary.length > 0 && (
        <>
          <div className="h-px bg-border/50 ml-8 mr-6" />
          <div className="pl-8 pr-6 py-3">
            <button
              type="button"
              onClick={() => setItineraryOpen((o) => !o)}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary/70" />
                Day-by-day itinerary
              </span>
              {itineraryOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {itineraryOpen && (
              <div className="mt-3 flex flex-col gap-4">
                {rec.itinerary.map((day) => (
                  <div key={day.date}>
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        {format(parseISO(day.date), 'EEE, MMM d')}
                      </span>
                      {day.note && (
                        <span className="text-xs text-muted-foreground">
                          {day.note}
                        </span>
                      )}
                    </div>
                    <ul className="flex flex-col gap-1 ml-1">
                      {day.activities.map((activity, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground leading-relaxed"
                        >
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatPill({ icon, children, pillBg }: StatPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pillBg}`}
    >
      {icon}
      {children}
    </span>
  );
}
