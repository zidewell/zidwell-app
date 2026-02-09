"use client";

const clients = [
  { name: "Nigerian Institute for Industrial Security", location: "Lagos" },
  { name: "Bared Consult", location: "Lagos" },
  { name: "Chiguard Services Nigeria Limited", location: "Lagos" },
  { name: "NIIS Integrated Ventures", location: "Lagos" },
  { name: "Wilson Esangbo and Co", location: "Lagos" },
  { name: "Lara's E-Mart", location: "Port Harcourt" },
  { name: "The Tech Corner", location: "Abuja" },
  { name: "Digital Business School", location: "Lagos" },
  { name: "Calabarfood Lagos", location: "Lagos" },
  { name: "Many more happy clients"},
];

const ClienteleSection = () => {
  return (
    <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden p-5">
      {/* Metallic aluminum background with more depth */}
      <div className="absolute inset-0 bg-linear-to-br from-[#d1d1d1] via-[#e5e5e5] to-[#b8b8b8]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.5)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.08)_0%,transparent_70%)]" />

      {/* Subtle metallic pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_50%,transparent_75%)] bg-size-[20px_20px]" />

      <div className="container-custom relative">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block px-4 py-1.5 bg-[#C29307]/20 border border-[#C29307] text-sm font-semibold text-[#18171c] mb-4 rounded-md">
            TRUSTED BY
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#18171c] mb-3">
            Businesses That Trust Zidwell
          </h2>
          <p className="text-[#18171c]/70 max-w-2xl mx-auto text-sm md:text-base">
            Join our growing family of satisfied clients across Nigeria
          </p>
        </div>

        {/* Client grid with perfect balance */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          {clients.map((client, index) => (
            <div
              key={index}
              className="group relative bg-white/70 backdrop-blur-sm border border-white/50 p-4 md:p-6 text-center transition-all duration-300 hover:bg-white/90 hover:-translate-y-2 hover:shadow-xl rounded-lg"
            >
              {/* Subtle shine effect on hover */}
              <div className="absolute inset-0 rounded-lg bg-linear-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Inner glow */}
              <div className="absolute inset-0 rounded-lg border border-white/0 group-hover:border-white/60 transition-all duration-300" />

              {/* Content */}
              <div className="relative">
                <p className="font-bold text-[13px] md:text-[15px] text-[#8B7306] leading-snug md:leading-tight">
                  {client.name}
                </p>
                <p className="text-xs md:text-sm text-[#18171c]/70 mt-2">
                  {client.location}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-linear-to-r from-transparent via-[#C29307]/50 to-transparent group-hover:w-3/4 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClienteleSection;