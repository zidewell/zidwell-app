import { Briefcase, Users, Zap, Wrench } from "lucide-react";

const reasons = [
  { icon: Briefcase, title: "Practical Business Education", desc: "Learn skills you can apply immediately to grow revenue." },
  { icon: Users, title: "Expert Coaches", desc: "Taught by experienced entrepreneurs and industry professionals." },
  { icon: Zap, title: "Short, Focused Programs", desc: "No fluff. Programs designed to deliver results in weeks, not years." },
  { icon: Wrench, title: "Real-World Tools", desc: "Work with the same tools and systems used by top companies." },
];

const WhyDBSSection = () => {
  return (
    <section id="why-dbs" className="py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="brutal-button bg-secondary text-secondary-foreground px-4 py-1 text-xs inline-block mb-4">
            Why Us
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Why Digital Business School
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r) => (
            <div key={r.title} className="brutal-card p-6 text-center">
              <div className="bg-secondary w-14 h-14 flex items-center justify-center mx-auto mb-4 border-2 border-primary">
                <r.icon size={24} className="text-secondary-foreground" />
              </div>
              <h3 className="font-display font-bold mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDBSSection;
