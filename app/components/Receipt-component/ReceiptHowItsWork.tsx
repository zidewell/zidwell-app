import React from 'react'


function ReceiptHowItsWork() {
  return (
   <section className="py-16 sm:py-20 ">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
              How It Works
            </h2>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Create Receipt",
                    description:
                      "Fill in your details, receiver info, and transaction items. Add your signature.",
                  },
                  {
                    step: "2",
                    title: "Share or Download",
                    description:
                      "Download the PDF or share a link with the receiver for acknowledgement.",
                  },
                  {
                    step: "3",
                    title: "Receiver Confirms",
                    description:
                      "Receiver views the receipt, toggles acknowledgement, and signs to confirm.",
                  },
                  {
                    step: "4",
                    title: "Both Parties Get Proof",
                    description:
                      "Download the final signed receipt as PDF. Simple, clear, done.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.step}
                    className="flex gap-4 items-start animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 bg-[#C29307] text-white">
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
  )
}

export default ReceiptHowItsWork