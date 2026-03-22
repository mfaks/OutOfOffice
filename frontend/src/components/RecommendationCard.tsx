import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Plane, Sparkles, TrendingUp } from 'lucide-react';
import type {
  RankConfig,
  StatPillProps,
  TripRecommendation,
} from '@/types/types';

const RANK_CONFIG: Record<number, RankConfig> = {
  1: {
    label: '1st pick',
    rank: '1',
    headerBg: 'bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-200',
    priceStyle: 'text-amber-600',
    accentBar: 'bg-gradient-to-b from-amber-400 to-yellow-500',
    pillBg: 'bg-white border border-amber-100 text-amber-800',
  },
  2: {
    label: '2nd pick',
    rank: '2',
    headerBg: 'bg-gradient-to-br from-slate-50 via-gray-50/60 to-white',
    badgeStyle: 'bg-slate-100 text-slate-700 border border-slate-200',
    priceStyle: 'text-slate-700',
    accentBar: 'bg-gradient-to-b from-slate-400 to-slate-500',
    pillBg: 'bg-white border border-slate-200 text-slate-600',
  },
  3: {
    label: '3rd pick',
    rank: '3',
    headerBg: 'bg-gradient-to-br from-orange-50 via-amber-50/60 to-white',
    badgeStyle: 'bg-orange-100 text-orange-800 border border-orange-200',
    priceStyle: 'text-orange-600',
    accentBar: 'bg-gradient-to-b from-orange-500 to-amber-500',
    pillBg: 'bg-white border border-orange-100 text-orange-800',
  },
};

export function RecommendationCard({ rec }: { rec: TripRecommendation }) {
  const config = RANK_CONFIG[rec.rank] ?? RANK_CONFIG[3];
  const start = format(parseISO(rec.start_date), 'MMM d');
  const end = format(parseISO(rec.end_date), 'MMM d, yyyy');
  const departs = format(
    parseISO(rec.best_flight.departs_at),
    'MMM d · h:mm a',
  );
  const returns = format(
    parseISO(rec.best_flight.returns_at),
    'MMM d · h:mm a',
  );
  const stopLabel =
    rec.best_flight.layovers === 0
      ? 'Nonstop'
      : `${rec.best_flight.layovers} stop${rec.best_flight.layovers > 1 ? 's' : ''}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/80">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accentBar}`}
      />

      <div className={`pl-8 pr-6 pt-5 pb-5 ${config.headerBg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeStyle}`}
            >
              <span className="text-sm leading-none">
                {['🥇', '🥈', '🥉'][rec.rank - 1]}
              </span>
              {config.label}
            </span>

            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
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
              <StatPill
                pillBg={config.pillBg}
                icon={<TrendingUp className="h-3 w-3" />}
              >
                {rec.yield_score}× yield
              </StatPill>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div
              className={`text-3xl font-bold tabular-nums ${config.priceStyle}`}
            >
              ${rec.best_flight.estimated_flight_cost.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 font-medium">
              est. flight cost
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 ml-8 mr-6" />

      <div className="pl-8 pr-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-50 border border-gray-100">
            <Plane className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {rec.best_flight.airline}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
            {stopLabel}
          </span>
        </div>

        <div className="ml-9 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Departs
            </div>
            <div className="text-sm font-medium text-gray-700">{departs}</div>
          </div>
          <div className="flex items-center gap-1 px-1">
            <div className="h-px w-8 bg-gray-200" />
            <Plane className="h-3 w-3 text-gray-300 rotate-90" />
            <div className="h-px w-8 bg-gray-200" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Returns
            </div>
            <div className="text-sm font-medium text-gray-700">{returns}</div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 ml-8 mr-6" />

      <div className="pl-8 pr-6 py-4 flex gap-2.5">
        <Sparkles className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
        <p className="text-sm leading-relaxed text-gray-500 italic">
          {rec.reasoning}
        </p>
      </div>
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
