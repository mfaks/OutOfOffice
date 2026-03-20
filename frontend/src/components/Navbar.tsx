import { Link } from 'react-router';

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src="./travel-bag.svg" alt="Shield" className="h-5 w-5" />
          <h1 className="m-0 h-5 text-lg font-semibold tracking-tight text-foreground leading-none">
            Hermes
          </h1>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
