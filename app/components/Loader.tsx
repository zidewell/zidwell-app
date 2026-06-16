// app/components/Loader.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function Loader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-52 gap-6">
      {/* Spinner icon */}
      <Loader2 className="h-10 w-10 text-(--color-accent-yellow) animate-spin" />
      
      {/* Ultra-thin progress bar */}
      <div className="w-64">
        <div className="bg-(--bg-secondary) rounded-full h-1 mb-2 overflow-hidden">
          <div
            className="bg-(--color-accent-yellow) h-full rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Centered percentage */}
        <div className="text-center">
          <span className="text-(--color-accent-yellow) text-sm font-medium">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default Loader;