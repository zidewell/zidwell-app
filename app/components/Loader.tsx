"use client";
import React, { useEffect, useState } from "react";

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
    <div className="flex flex-col items-center justify-center h-52">
      <div className="w-64">
        {/* Ultra-thin progress bar */}
        <div className="bg-gray-300 rounded-full h-0.5 mb-2 overflow-hidden">
          <div
            className="bg-[#2b825b] h-full rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Centered percentage only */}
        <div className="text-center">
          <span className="text-[#2b825b] text-sm font-medium">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default Loader;
