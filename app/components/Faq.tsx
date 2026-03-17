import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const faqs = [
  {
    question: "Is Zidwell a bank?",
    answer:
      "No. Zidwell partners with licensed financial institutions to provide secure financial services. We're a financial wellness platform, not a bank.",
  },
  {
    question: "Do I need to be a business owner to use Zidwell?",
    answer:
      "No. Zidwell works for individuals, freelancers, and businesses. Whether you're just starting out or running an established company, Zidwell can help you manage your finances better.",
  },
  {
    question: "Is my money safe?",
    answer:
      "Yes. All funds are held with regulated partners and protected by standard security practices. We take the security of your money very seriously.",
  },
  {
    question: "Can I start for free?",
    answer:
      "Yes. You can use Zidwell for free with our Pay Per Use plan and upgrade anytime. No credit card required to get started.",
  },
  {
    question: "How do I earn ZidCoins?",
    answer:
      "You earn 20 ZidCoins every time you spend ₦2,500 or more on airtime, data, cable subscriptions, or electricity payments through Zidwell. You can also earn through referrals.",
  },
  {
    question: "What happens when I reach 3,000 ZidCoins?",
    answer:
      "Once your ZidCoin balance reaches 3,000 ZC (equivalent to ₦3,000), you can cash out by using it to purchase airtime or data for yourself.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-gray-900 dark:text-gray-50">
            Frequently Asked <span className="text-[#2b825b]">Questions</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Got questions? We've got answers.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] px-6 data-[state=open]:shadow-[6px_6px_0px_#111827] dark:data-[state=open]:shadow-[6px_6px_0px_#fbbf24] data-[state=open]:-translate-x-0.5 data-[state=open]:-translate-y-0.5 transition-all"
              >
                <AccordionTrigger className="text-left font-bold hover:no-underline py-6 text-gray-900 dark:text-gray-50">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 dark:text-gray-400 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
