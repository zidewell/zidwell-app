import { UserPlus, Video, ClipboardCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Enroll in a Program",
    desc: "Pick a course that matches your goals and sign up.",
  },
  {
    icon: Video,
    title: "Join Live Classes",
    desc: "Attend interactive sessions on Google Meet twice a week.",
  },
  {
    icon: ClipboardCheck,
    title: "Complete Projects",
    desc: "Apply what you learn through practical assignments.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-primary text-primary-foreground">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="brutal-button bg-secondary text-secondary-foreground px-4 py-1 text-xs inline-block mb-4">
            Process
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            How Classes Work
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="border-2 border-primary-foreground p-6 text-center relative">
              <span className="absolute -top-4 -left-2 bg-secondary text-secondary-foreground font-display font-bold w-8 h-8 flex items-center justify-center text-sm border-2 border-primary-foreground">
                {i + 1}
              </span>
              <step.icon className="mx-auto mb-4 text-secondary" size={40} strokeWidth={1.5} />
              <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm font-body opacity-80">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
