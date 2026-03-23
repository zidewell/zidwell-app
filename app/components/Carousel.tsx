"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
  "/zid-pic/image1.jpg",
  "/zid-pic/image2.jpg",
  "/zid-pic/image3.jpg",
  "/zid-pic/image4.jpg",
  "/zid-pic/image5.jpg",
  "/zid-pic/image6.jpg",
  "/zid-pic/image8.jpg",
  "/zid-pic/image9.jpg",
  "/zid-pic/image10.jpg",
  "/zid-pic/image11.jpg",
  "/zid-pic/image12.jpg",
  "/zid-pic/image13.jpg",
  "/zid-pic/image14.jpg",
  "/zid-pic/image15.jpg",
  "/zid-pic/image16.jpg",
  "/zid-pic/image17.jpg",
];

const Carousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const autoSlide: boolean = true;
  const autoSlideInterval: number = 15000;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!autoSlide) return;
    const interval = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(interval);
  }, [autoSlideInterval]);

  // Handle image load
  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="relative hidden lg:block w-[50%] h-screen overflow-hidden bg-gray-100">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slides Container */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="relative w-full h-full shrink-0">
            {/* Loading placeholder */}
            {!imagesLoaded[index] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="w-8 h-8 border-4 border-[#2b825b] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Image */}
            <Image
              src={slide}
              alt={`Slide ${index + 1}`}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imagesLoaded[index] ? "opacity-100" : "opacity-0"
              }`}
              sizes="50vw"
              priority={index === 0}
              onLoad={() => handleImageLoad(index)}
              onError={() => console.error(`Failed to load image: ${slide}`)}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {current + 1} / {slides.length}
      </div>
    </div>
  );
};

export default Carousel;
