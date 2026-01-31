"use client"
import { useEffect, useRef, useState } from "react";

interface TallyEmbedProps {
  formId: string;
}

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

export function TallyEmbed({ formId }: TallyEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Only load script once
    if (scriptLoaded.current) {
      setIsLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    script.onload = () => {
      if (window.Tally) {
        window.Tally.loadEmbeds();
      }
      scriptLoaded.current = true;
      setIsLoading(false);
    };
    
    script.onerror = () => {
      scriptLoaded.current = false;
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Remove script on unmount
      const scripts = document.querySelectorAll('script[src="https://tally.so/widgets/embed.js"]');
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
      scriptLoaded.current = false;
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[600px] animate-fade-in" style={{ animationDelay: "0.3s" }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#C29307]/20 border-t-[#C29307] rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">Loading form...</p>
          </div>
        </div>
      )}
      <iframe
        src={`https://tally.so/embed/${formId}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
        loading="eager"
        width="100%"
        height="100%"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Client Onboarding Form"
        className="min-h-[600px] rounded-lg"
      />
    </div>
  );
}