function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-12">
      <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Hermes
        </h1>
        <p className="text-xl font-medium text-foreground">
          Your calendar is full of opportunities. You just can't see them yet.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Tell us your days off, where you want to go, and how many PTO days you
          have left. We will find the top trips worth actually taking.
        </p>
      </div>
    </div>
  );
}

export default Home;
