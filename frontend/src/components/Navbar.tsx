import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';

// Render the sticky top navigation bar with the logo and a theme toggle
function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm">
            <img
              src="./travel-bag.svg"
              alt="OutOfOffice"
              className="h-5 w-5 brightness-0 invert"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground leading-none">
            OutOfOffice
          </span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}

export default Navbar;
