function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-6">
        <p className="text-s text-muted-foreground">
          &copy; {new Date().getFullYear()} Hermes.
        </p>
        <a
          href="https://github.com/mfaks/Hermes"
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
