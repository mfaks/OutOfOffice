import { CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { TripPlannerDialog } from './TripPlannerDialog';
import { TypographyH1, TypographyLead } from './ui/typography';

const features = [
  { icon: CalendarDays, label: 'Reads your PTO calendar' },
  { icon: Sparkles, label: 'AI finds optimal windows' },
  { icon: MapPin, label: 'Suggests real destinations' },
];

function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem-3.5rem)] flex-col items-center justify-center overflow-hidden px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/60 via-transparent to-transparent" />
      <div className="relative flex flex-col items-center gap-8 text-center max-w-3xl">
        <TypographyH1 className="max-w-2xl">
          Your next great trip is hiding in your calendar
        </TypographyH1>
        <TypographyLead className="max-w-lg">
          Tell us your days off, where you want to go, and how many PTO days you
          have left. Hermes finds the trips worth actually taking.
        </TypographyLead>
        <TripPlannerDialog triggerClassName="h-12 px-10 text-base rounded-xl" />
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
