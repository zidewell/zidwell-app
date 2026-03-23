const FinalCTA = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-secondary-foreground mb-4">
          Start Learning Skills That Grow Businesses
        </h2>
        <p className="text-secondary-foreground/70 font-body mb-8 max-w-lg mx-auto">
          Join hundreds of entrepreneurs and professionals who are building real skills for the modern economy.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#programs"
            className="brutal-button bg-primary text-primary-foreground px-8 py-3 text-sm"
          >
            View Programs
          </a>
          <a
            href="#pricing"
            className="brutal-button bg-card text-foreground px-8 py-3 text-sm"
          >
            Enroll Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
