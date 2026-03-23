import { Users } from "lucide-react";

const CommunitySection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="brutal-card p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <div className="bg-secondary w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-primary">
            <Users size={32} className="text-secondary-foreground" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Learn With Other Ambitious Builders
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto mb-6">
            Join the Financial Wellness Club, a growing network of entrepreneurs and professionals committed to growth and collaboration.
          </p>
          <button className="brutal-button bg-primary text-primary-foreground px-8 py-3 text-sm">
            Join the Community
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
