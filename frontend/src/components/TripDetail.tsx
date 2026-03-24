import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ArrowRight, Plane, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { SavedTrip, UserPreferences } from '@/types/types';
import { RecommendationCard } from './RecommendationCard';
import { Button } from './ui/button';
import { TypographyH1, TypographyMuted } from './ui/typography';

function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  const {
    data: trip,
    isLoading,
    isError,
  } = useQuery<SavedTrip>({
    queryKey: ['saved-trip', tripId],
    enabled: !!token && !!tripId,
    queryFn: () =>
      fetch(`http://localhost:8000/me/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      }),
  });

  const { data: prefs } = useQuery<UserPreferences>({
    queryKey: ['preferences'],
    enabled: !!token,
    queryFn: () =>
      fetch('http://localhost:8000/me/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
  });

  const { mutate: deleteTrip, isPending: isDeleting } = useMutation({
    mutationFn: () =>
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
      navigate('/account');
    },
    onError: () => toast.error('Failed to remove trip. Please try again.'),
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <TypographyMuted>Loading trip…</TypographyMuted>
        </div>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <TypographyMuted>Trip not found.</TypographyMuted>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate('/account')}
          >
            Back to account
          </Button>
        </div>
      </div>
    );
  }

  const start = format(parseISO(trip.start_date), 'MMM d');
  const end = format(parseISO(trip.end_date), 'MMM d, yyyy');
  const searchUrl = `https://www.kayak.com/flights/${trip.departure}-${trip.destination}/${trip.start_date}/${trip.end_date}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Plane className="h-4 w-4 text-primary shrink-0" />
            </div>
            <TypographyH1 className="flex items-center gap-2.5 text-2xl">
              <span>{trip.departure}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{trip.destination}</span>
            </TypographyH1>
          </div>
          <TypographyMuted className="ml-11 font-medium">
            {start} – {end}
            {' · '}
            {trip.pto_days_used} PTO days used
            {' · '}
            {prefs?.pto_days_remaining != null
              ? `${prefs.pto_days_remaining} PTO days remaining`
              : 'PTO balance not tracked'}
          </TypographyMuted>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <RecommendationCard rec={trip.recommendation} searchUrl={searchUrl} />

        <div className="mt-6">
          {confirming ? (
            <div className="flex items-center gap-3">
              <TypographyMuted className="text-sm">
                Remove this trip and restore PTO?
              </TypographyMuted>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => deleteTrip()}
              >
                {isDeleting ? 'Removing…' : 'Yes, remove'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove trip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripDetail;
