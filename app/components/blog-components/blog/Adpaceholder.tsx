// components/ads/AdPlaceholder.tsx
"use client";

import { useEffect, useRef } from "react";

interface AdPlaceholderProps {
  variant?: "horizontal" | "vertical" | "inline";
  adSlot?: string;
  adFormat?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

const AdPlaceholder = ({ 
  variant = "horizontal", 
  adSlot = "1234567890", // Replace with your actual ad slot IDs
  adFormat = "auto",
  className = ""
}: AdPlaceholderProps) => {
  // Change this from HTMLDivElement to HTMLModElement (or HTMLElement)
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Load Google Ads script if not already loaded
    if (typeof window !== "undefined" && !document.querySelector("#google-ads-script")) {
      const script = document.createElement("script");
      script.id = "google-ads-script";
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3255896105120976";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Initialize ad after script loads
    const initAd = () => {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        try {
          (window as any).adsbygoogle.push({});
        } catch (e) {
          console.error("AdSense error:", e);
        }
      }
    };

    // Small delay to ensure script is loaded
    const timer = setTimeout(initAd, 100);
    return () => clearTimeout(timer);
  }, []);

  const getStyles = () => {
    switch (variant) {
      case "vertical":
        return "min-h-[250px] sm:min-h-[600px]";
      case "inline":
        return "min-h-[90px] sm:min-h-[120px] my-4 sm:my-8";
      default:
        return "min-h-[90px] sm:min-h-[120px]";
    }
  };

  const getAdFormat = () => {
    if (adFormat !== "auto") return adFormat;
    switch (variant) {
      case "vertical":
        return "vertical";
      case "horizontal":
        return "horizontal";
      default:
        return "auto";
    }
  };

  return (
    <div className={`ad-container ${getStyles()} ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3255896105120976"
        data-ad-slot={adSlot}
        data-ad-format={getAdFormat()}
        data-full-width-responsive="true"
        ref={adRef}
      />
    </div>
  );
};

export default AdPlaceholder;