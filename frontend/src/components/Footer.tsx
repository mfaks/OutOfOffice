// Render the page footer with the copyright notice and a GitHub link
function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/50">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} OutOfOffice.
        </p>
        <a
          href="https://github.com/mfaks/OutOfOffice"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <img src="/github.svg" alt="GitHub" className="h-8 w-8 dark:invert" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
