function Footer() {
  return (
    <footer className="sticky bottom-0 border-t border-border bg-background">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-s text-muted-foreground">
          &copy; {new Date().getFullYear()} Hermes.
        </p>
        <a
          href="https://github.com/mfaks/Hermes"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <img src="/github.svg" alt="GitHub" className="h-8 w-8" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
