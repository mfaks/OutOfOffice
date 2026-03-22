import { ArrowRight, Plane } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { TripPlannerResponse } from '@/types/types';
import { RecommendationCard } from './RecommendationCard';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const response = location.state?.response as TripPlannerResponse | undefined;

  useEffect(() => {
    if (!response) navigate('/', { replace: true });
  }, [response, navigate]);

  if (!response) return null;

  const { recommendations, request } = response;

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="flex items-center gap-3 mb-1.5">
            <Plane className="h-5 w-5 text-gray-300 shrink-0" />
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 tracking-tight">
              <span>{request.departure}</span>
              <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{request.destination}</span>
            </h1>
          </div>

          <p className="ml-8 text-sm text-gray-400 font-medium">
            {recommendations.length} trip
            {recommendations.length !== 1 ? 's' : ''} recommended
            {' · '}
            {request.pto_days_remaining} PTO days available
            {request.max_flight_budget
              ? ` · $${request.max_flight_budget.toLocaleString()} max budget`
              : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {recommendations.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-8 py-16 text-center">
            <Plane className="h-10 w-10 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No trips found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your budget or PTO days.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.rank} rec={rec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;
