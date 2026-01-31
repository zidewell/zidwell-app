"use client"
import { TallyEmbed } from "../components/finance-landing-components/get-started-onboarding/TallyEmbed"; 
import { ProcessStep } from "../components/finance-landing-components/get-started-onboarding/ProcessStep";
import { TrustBadge } from "../components/finance-landing-components/get-started-onboarding/TrustBadge"; 
import { ClipboardCheck, Search, Phone, Handshake, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

const OnboardingPage = () => {
  const TALLY_FORM_ID = "447JoO";

  useEffect(() => {
    // Preload resources for faster loading
    const preconnectLink = document.createElement("link");
    preconnectLink.rel = "preconnect";
    preconnectLink.href = "https://tally.so";
    document.head.appendChild(preconnectLink);

    return () => {
      if (preconnectLink.parentNode) {
        preconnectLink.parentNode.removeChild(preconnectLink);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0;
            transform: translateX(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease forwards;
        }
        
        .gold-gradient-text {
          background: linear-gradient(135deg, #C29307 0%, #E6B325 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="min-h-screen relative bg-gradient-to-br from-[#FDF8ED] to-white">
        {/* Background pattern */}
        <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `radial-gradient(#C29307 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
          {/* Left Sidebar - 30% on desktop */}
          <aside className="w-full lg:w-[30%] xl:w-[28%] bg-white/80 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-gray-200 p-6 lg:p-8 xl:p-10 flex flex-col">
            {/* Logo */}
            <div className="mb-8 opacity-0 animate-slide-in-left" style={{ animationDelay: "0s" }}>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center border-2 border-[#C29307] shadow-[4px_4px_0px_#111827] bg-black p-1">
                  <span className="font-black text-xl text-white">Z</span>
                </div>
                <span className="font-black text-xl tracking-tight text-gray-900">
                  Zidwell
                </span>
              </Link>
            </div>
            
            {/* Main heading */}
            <div className="space-y-4 mb-8">
              <h1 
                className="text-3xl lg:text-4xl font-semibold text-gray-900 leading-tight opacity-0 animate-slide-in-left"
                style={{ animationDelay: "0.1s" }}
              >
                Let's Understand{" "}
                <span className="gold-gradient-text">Your Business</span>
              </h1>
              <p 
                className="text-gray-600 text-base lg:text-lg opacity-0 animate-slide-in-left"
                style={{ animationDelay: "0.2s" }}
              >
                This short form helps us understand your business, your numbers, and how best to serve you.
              </p>
            </div>
            
            {/* Explanation */}
            <div 
              className="space-y-3 mb-8 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <p className="text-sm text-gray-900 font-medium">
                We don't believe in generic accounting or copy-and-paste solutions.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every business is different — your size, revenue, industry, and challenges all matter. 
                The information you share here allows our finance team to:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#C29307] mt-0.5">•</span>
                  Review your business needs properly
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C29307] mt-0.5">•</span>
                  Identify gaps in your accounting or tax structure
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C29307] mt-0.5">•</span>
                  Recommend the right level of support
                </li>
              </ul>
            </div>
            
            {/* Time estimate */}
            <div 
              className="flex items-center gap-2 text-sm text-gray-600 mb-8 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Clock className="w-4 h-4 text-[#C29307]" />
              <span>This form takes about 5–7 minutes to complete.</span>
            </div>
            
            {/* Trust badge */}
            <div className="mb-8">
              <TrustBadge />
            </div>
            
            {/* Process steps */}
            <div className="mt-auto space-y-1">
              <p 
                className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 opacity-0 animate-fade-in"
                style={{ animationDelay: "0.7s" }}
              >
                What happens next
              </p>
              <div className="space-y-3">
                <ProcessStep 
                  icon={ClipboardCheck} 
                  number={1} 
                  title="We review your responses" 
                  delay="0.8s"
                />
                <ProcessStep 
                  icon={Search} 
                  number={2} 
                  title="Identify key finance & tax needs" 
                  delay="0.9s"
                />
                <ProcessStep 
                  icon={Phone} 
                  number={3} 
                  title="Short call or follow-up" 
                  delay="1.0s"
                />
                <ProcessStep 
                  icon={Handshake} 
                  number={4} 
                  title="Propose the best support" 
                  delay="1.1s"
                />
              </div>
              <p 
                className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 opacity-0 animate-fade-in"
                style={{ animationDelay: "1.2s" }}
              >
                No pressure. No obligation.
              </p>
            </div>
          </aside>
          
          {/* Right Content - 70% Form Area */}
          <main className="flex-1 w-full lg:w-[70%] xl:w-[72%] p-6 lg:p-8 xl:p-10">
            {/* Form header microcopy */}
            <div 
              className="max-w-2xl mx-auto mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="px-3 py-1.5 rounded-full bg-[#C29307]/5 border border-[#C29307]/10">
                  "There's no such thing as too small or too early."
                </span>
                <span className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                  "If you're unsure, answer as best as you can."
                </span>
                <span className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                  "This is not a test — it's a starting point."
                </span>
              </div>
            </div>
            
            {/* Tally Form Container */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 lg:p-6 shadow-lg">
                <TallyEmbed formId={TALLY_FORM_ID} />
              </div>
              
              {/* Fallback link */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Having trouble loading?{" "}
                  <a 
                    href={`https://tally.so/r/${TALLY_FORM_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C29307] hover:underline font-medium"
                  >
                    Open form in new tab
                  </a>
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;