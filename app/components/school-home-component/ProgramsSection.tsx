"use client"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Calendar, DollarSign } from "lucide-react";

// import courseBusinessGrowth from "@/assets/course-business-growth.jpg";
// import courseProductManagement from "@/assets/course-product-management.jpg";
// import courseDataAnalytics from "@/assets/course-data-analytics.jpg";
// import courseAiAutomation from "@/assets/course-ai-automation.jpg";

const courses = [
  {
    id: 1,
    title: "Business Growth Program",
    duration: "4 weeks",
    frequency: "Twice a week",
    fee: "₦80,000",
    // image: courseBusinessGrowth,
    description:
      "A hands-on program designed to equip entrepreneurs with proven growth strategies for the Nigerian market.",
    focus: [
      "The real strategies businesses use to grow into multi-million naira companies within a short time.",
      "The step-by-step blueprint for growing a business in the Nigerian context.",
      "The financial systems every business must have if you operate in Nigeria.",
      "How to make customers fall in love with what you sell and keep coming back.",
      "AI tools and automations that reduce stress and save you time.",
      "How to access loans, grants, and investors looking for businesses to support.",
    ],
    guarantee:
      "If you complete the program and it doesn't deliver value, you get your money back.",
  },
  {
    id: 2,
    title: "Project & Product Management",
    duration: "6 weeks",
    frequency: "Twice a week",
    fee: "₦80,000",
    // image: courseProductManagement,
    description:
      "Master the art of building and shipping digital products with modern agile methodologies.",
    focus: [
      "Product thinking and user-centered design",
      "Agile workflows and sprint planning",
      "Project planning and resource management",
      "Team coordination and leadership",
      "Digital product delivery and launch strategies",
    ],
  },
  {
    id: 3,
    title: "Data & Business Analytics",
    duration: "8 weeks",
    frequency: "Twice a week",
    fee: "₦80,000",
    // image: courseDataAnalytics,
    description:
      "Learn to turn raw data into actionable business insights using industry-standard tools.",
    focus: [
      "Data analysis with Excel and Google Sheets",
      "SQL for querying and managing databases",
      "Power BI for interactive dashboards",
      "Business decision making with data",
      "Data storytelling and visualization",
      "Extracting business insights from complex datasets",
    ],
  },
  {
    id: 4,
    title: "AI & Business Automation",
    duration: "4 weeks",
    frequency: "Twice a week",
    fee: "₦80,000",
    // image: courseAiAutomation,
    description:
      "Leverage AI and automation to streamline operations and scale your business faster.",
    focus: [
      "AI tools for business operations",
      "Automation workflows and integrations",
      "AI-powered marketing strategies",
      "AI productivity systems for teams",
    ],
  },
];

const ProgramsSection = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section id="programs" className="py-20">
      <div className="container">
        <div className="mb-12">
          <span className="brutal-button bg-secondary text-secondary-foreground px-4 py-1 text-xs inline-block mb-4">
            What We Teach
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Our Programs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const isExpanded = expandedId === course.id;
            return (
              <motion.div
                key={course.id}
                layout
                className={`brutal-card overflow-hidden ${
                  isExpanded ? "md:col-span-2" : ""
                }`}
                transition={{ layout: { duration: 0.2 } }}
              >
                <div className={`${isExpanded ? "md:flex" : ""}`}>
                  <div className={`${isExpanded ? "md:w-1/3" : ""}`}>
                    <img
                      // src={course.image}
                      src={""}
                      alt={course.title}
                      className="w-full h-48 object-cover border-b-2 border-primary"
                    />
                  </div>

                  <div className={`p-6 ${isExpanded ? "md:w-2/3" : ""}`}>
                    <h3 className="font-display text-xl font-bold mb-3">
                      {course.title}
                    </h3>

                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground font-body">
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {course.frequency}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <DollarSign size={14} /> {course.fee}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-muted-foreground font-body mb-4">
                            {course.description}
                          </p>
                          <h4 className="font-display font-semibold mb-2">
                            What you'll learn:
                          </h4>
                          <ul className="space-y-2 mb-4">
                            {course.focus.map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm font-body text-muted-foreground"
                              >
                                <span className="w-2 h-2 bg-secondary mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          {course.guarantee && (
                            <div className="bg-secondary/20 border-2 border-secondary p-4 mt-4">
                              <p className="text-sm font-body font-semibold text-foreground">
                                💰 Money Back Guarantee
                              </p>
                              <p className="text-sm text-muted-foreground font-body mt-1">
                                {course.guarantee}
                              </p>
                            </div>
                          )}
                          <a
                            href="#pricing"
                            className="brutal-button bg-primary text-primary-foreground px-6 py-2 text-sm inline-block mt-4"
                          >
                            Enroll Now
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : course.id)
                      }
                      className="flex items-center gap-1 text-sm font-display font-semibold mt-4 hover:text-secondary transition-colors"
                    >
                      {isExpanded ? "Show Less" : "View Details"}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
