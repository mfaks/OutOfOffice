import { Link } from 'react-router';

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex h-16 w-full items-center px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm">
            <img
              src="./travel-bag.svg"
              alt="Hermes"
              className="h-5 w-5 brightness-0 invert"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground leading-none">
            Hermes
          </span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
