import { CalendarDays, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthDialog from './AuthDialog';
import { TripPlannerDialog } from './TripPlannerDialog';
import { Button } from './ui/button';
import {
  TypographyH1,
  TypographyH3,
  TypographyLead,
  TypographyMuted,
  TypographySmall,
} from './ui/typography';

const steps = [
  {
    icon: CalendarDays,
    title: 'Share your schedule',
    description:
      "Enter your PTO days, company holidays, and where you're flying from.",
  },
  {
    icon: Search,
    title: 'We find the windows',
    description:
      'Hermes scans for gaps where one PTO day turns into a 4- or 5-day weekend.',
  },
  {
    icon: MapPin,
    title: 'Book with confidence',
    description:
      'Get ranked trips with real flight estimates, travel dates, and efficiency scores.',
  },
];

function Home() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-6 py-8 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4 max-w-3xl w-full">
        <TypographyH1>No PTO left behind.</TypographyH1>

        <TypographyLead className="max-w-lg">
          Hermes finds trips where your PTO goes furthest.
          <br />
          Real flights, real dates, real adventures.
        </TypographyLead>

        {user ? (
          <div className="mt-1 flex flex-col items-center gap-2">
            <TripPlannerDialog
              triggerClassName="h-12 px-10 text-base rounded-full bg-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 hover:shadow-xl transition-all"
              triggerLabel="✈️ Find my flight"
            />
            <TypographySmall className="text-muted-foreground">
              Signed in as {user.email}
            </TypographySmall>
          </div>
        ) : (
          <div className="mt-1 flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <TripPlannerDialog
                triggerClassName="h-14 px-12 text-lg rounded-full font-semibold border-2 border-primary/40 bg-transparent text-primary hover:bg-primary/10 transition-all"
                triggerLabel="Try Demo"
              />
              <Button
                size="lg"
                className="h-14 px-12 text-lg rounded-full font-semibold shadow-lg hover:opacity-90 hover:shadow-xl transition-all"
                onClick={() => setAuthOpen(true)}
              >
                Get Started
              </Button>
            </div>
            <TypographySmall className="text-muted-foreground">
              Create a free account to save results and unlock 3 searches per
              day.
            </TypographySmall>
          </div>
        )}

        <div className="mt-4 flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-border/60" />
          <TypographySmall className="font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </TypographySmall>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-5 text-center shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <TypographyMuted className="mb-0.5 text-xs font-semibold uppercase tracking-widest">
                  Step {i + 1}
                </TypographyMuted>
                <TypographyH3 className="text-base">{title}</TypographyH3>
              </div>
              <TypographyMuted className="leading-relaxed">
                {description}
              </TypographyMuted>
            </div>
          ))}
        </div>
      </div>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}

export default Home;
