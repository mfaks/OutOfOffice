import { Link } from 'react-router';

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <img src="./travel-bag.svg" alt="Hermes" className="h-6 w-6" />
          <span className="text-xl font-semibold tracking-tight text-foreground leading-none">
            Hermes
          </span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
