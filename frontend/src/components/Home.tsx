import { CalendarDays, MapPin, Search } from 'lucide-react';
import { TripPlannerDialog } from './TripPlannerDialog';
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
      'OutOfOffice scans for gaps where one PTO day turns into a 4- or 5-day weekend.',
  },
  {
    icon: MapPin,
    title: 'Book with confidence',
    description:
      'Get ranked trips with real flight estimates, travel dates, and efficiency scores.',
  },
];

// Render the landing page with the hero section and a how-it-works breakdown
function Home() {
  return (
    <section
      aria-labelledby="home-heading"
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-6 py-8 text-center"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(to_right,#E61E4D,#E31C5F,#D70466)]" />

      <div className="relative flex flex-col items-center gap-4 max-w-3xl w-full">
        <TypographyH1 id="home-heading">No PTO left behind.</TypographyH1>

        <TypographyLead className="max-w-lg">
          OutOfOffice finds trips where your PTO goes furthest.
          <br />
          Real flights, real dates, real adventures.
        </TypographyLead>

        <div className="mt-1 flex flex-col items-center gap-2">
          <TripPlannerDialog
            triggerClassName="h-14 px-12 text-lg rounded-full font-semibold shadow-lg hover:opacity-90 hover:shadow-xl transition-all bg-[linear-gradient(to_right,#E61E4D_0%,#E31C5F_50%,#D70466_100%)] text-white border-transparent"
            triggerLabel="Plan my trip"
          />
        </div>

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
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-5 text-center hover:shadow-md transition-shadow duration-200"
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
              <TypographyMuted>{description}</TypographyMuted>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Home;
