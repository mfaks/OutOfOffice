import { ArrowRight, Plane } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { TripPlannerResponse, TripRecommendation } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TypographyH1, TypographyMuted, TypographyP } from './ui/typography';
import { RecommendationCard } from './RecommendationCard';

type SortKey = 'rank' | 'price' | 'pto' | 'days' | 'layovers';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'rank', label: 'Best match' },
  { key: 'price', label: 'Lowest price' },
  { key: 'pto', label: 'Least PTO' },
  { key: 'days', label: 'Most days off' },
  { key: 'layovers', label: 'Fewest layovers' },
];

function sortRecs(
  recs: TripRecommendation[],
  key: SortKey,
): TripRecommendation[] {
  const sorted = [...recs];
  switch (key) {
    case 'price':
      sorted.sort(
        (a, b) =>
          a.best_flight.estimated_flight_cost -
          b.best_flight.estimated_flight_cost,
      );
      break;
    case 'pto':
      sorted.sort((a, b) => a.pto_days_used - b.pto_days_used);
      break;
    case 'days':
      sorted.sort((a, b) => b.total_days_off - a.total_days_off);
      break;
    case 'layovers':
      sorted.sort((a, b) => a.best_flight.layovers - b.best_flight.layovers);
      break;
    default:
      sorted.sort((a, b) => a.rank - b.rank);
  }
  return sorted;
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const response = location.state?.response as TripPlannerResponse | undefined;

  const [recommendations, setRecommendations] = useState(
    response?.recommendations ?? [],
  );
  const [threadId] = useState(response?.thread_id);
  const [feedback, setFeedback] = useState('');
  const [refining, setRefining] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('rank');

  const sorted = useMemo(
    () => sortRecs(recommendations, sortKey),
    [recommendations, sortKey],
  );

  useEffect(() => {
    if (!response) navigate('/', { replace: true });
  }, [response, navigate]);

  if (!response) return null;

  const { request } = response;

  async function handleRefine() {
    if (!feedback.trim() || !threadId) return;
    setRefining(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/trips/${threadId}/feedback?feedback=${encodeURIComponent(feedback)}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.detail ?? 'Something went wrong. Please try again.', {
          duration: 6000,
        });
        return;
      }
      const data: TripPlannerResponse = await res.json();
      setRecommendations(data.recommendations);
      setFeedback('');
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Plane className="h-4 w-4 text-primary shrink-0" />
            </div>
            <TypographyH1 className="flex items-center gap-2.5 text-2xl">
              <span>{request.departure}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{request.destination}</span>
            </TypographyH1>
          </div>
          <TypographyMuted className="ml-11 font-medium">
            {recommendations.length} trip
            {recommendations.length === 1 ? '' : 's'} recommended
            {' · '}
            {request.pto_days_remaining} PTO days available
            {request.max_flight_budget
              ? ` · $${request.max_flight_budget.toLocaleString()} max budget`
              : ''}
          </TypographyMuted>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        {recommendations.length > 0 && (
          <fieldset
            aria-label="Sort results"
            className="mb-5 flex items-center gap-2 flex-wrap"
          >
            <TypographyMuted className="text-xs font-semibold uppercase tracking-widest mr-1">
              Sort by
            </TypographyMuted>
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={sortKey === key}
                onClick={() => setSortKey(key)}
                className={`rounded-full border px-3.5 py-2.5 text-xs font-medium transition-all ${
                  sortKey === key
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </fieldset>
        )}

        {recommendations.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border shadow-sm px-8 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Plane className="h-7 w-7 text-muted-foreground" />
            </div>
            <TypographyP className="font-semibold text-lg">
              No flights found within your budget.
            </TypographyP>
            <TypographyMuted className="mt-1.5">
              Try increasing your max flight budget or picking a different
              destination.
            </TypographyMuted>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((rec) => (
              <RecommendationCard
                key={rec.rank}
                rec={rec}
                searchUrl={`https://www.kayak.com/flights/${request.departure}-${request.destination}/${rec.start_date}/${rec.end_date}`}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-2">
          <Input
            aria-label="Refine results"
            className="bg-card border-border rounded-xl"
            placeholder='e.g. "find me cheaper options" or "I want a longer trip"'
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
            disabled={refining}
          />
          <Button
            className="rounded-xl bg-primary text-primary-foreground hover:opacity-90"
            onClick={handleRefine}
            disabled={refining || !feedback.trim()}
          >
            {refining ? 'Refining…' : 'Refine'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Results;
