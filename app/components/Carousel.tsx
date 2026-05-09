"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
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

// Preload images function
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => reject();
  });
};

const Carousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(
    new Set(),
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoSlide = true;
  const autoSlideInterval = 15000;
  const touchStartX = useRef<number | null>(null);

  // Preload adjacent images for smoother transitions
  const preloadAdjacentImages = useCallback(
    (currentIndex: number) => {
      const adjacentIndices = [
        (currentIndex + 1) % slides.length,
        (currentIndex + 2) % slides.length,
        (currentIndex - 1 + slides.length) % slides.length,
      ];

      adjacentIndices.forEach(async (index) => {
        if (!preloadedImages.has(index)) {
          try {
            await preloadImage(slides[index]);
            setPreloadedImages((prev) => new Set(prev).add(index));
          } catch (error) {
            console.error(`Failed to preload image ${slides[index]}:`, error);
          }
        }
      });
    },
    [preloadedImages],
  );

  // Preload all images on mount (optional - uncomment if needed)
  useEffect(() => {
    // Preload first 3 images immediately
    const initialImages = slides.slice(0, 3);
    initialImages.forEach(async (src, idx) => {
      try {
        await preloadImage(src);
        setPreloadedImages((prev) => new Set(prev).add(idx));
      } catch (error) {
        console.error(`Failed to preload image ${src}:`, error);
      }
    });

    // Preload remaining images lazily
    const preloadRemaining = async () => {
      for (let i = 3; i < slides.length; i++) {
        try {
          await preloadImage(slides[i]);
          setPreloadedImages((prev) => new Set(prev).add(i));
        } catch (error) {
          console.error(`Failed to preload image ${slides[i]}:`, error);
        }
      }
    };

    preloadRemaining();
  }, []);

  // Preload adjacent images when current slide changes
  useEffect(() => {
    preloadAdjacentImages(current);
  }, [current, preloadAdjacentImages]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  // Auto-slide effect
  useEffect(() => {
    if (!autoSlide) return;
    const interval = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(interval);
  }, [autoSlide, nextSlide, autoSlideInterval]);

  // Handle image load
  const handleImageLoad = useCallback((index: number) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }));
  }, []);

  // Touch handlers for mobile (if needed)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative hidden lg:block w-[50%] h-screen overflow-hidden bg-gray-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-sm"
        aria-label="Previous slide"
        disabled={isTransitioning}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all backdrop-blur-sm"
        aria-label="Next slide"
        disabled={isTransitioning}
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
            {/* Skeleton Loader */}
            {!imagesLoaded[index] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="w-12 h-12 border-4 border-(--color-accent-yellow) border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Image with Next.js optimization */}
            <Image
              src={slide}
              alt={`Slide ${index + 1}`}
              fill
              className={`object-cover transition-opacity duration-500 ${
                imagesLoaded[index] ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={85}
              priority={index === 0 || index === 1 || index === 2}
              loading={index < 3 ? "eager" : "lazy"}
              onLoad={() => handleImageLoad(index)}
              onError={() => console.error(`Failed to load image: ${slide}`)}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3C/svg%3E`}
            />

            {/* Gradient Overlay - Made lighter for better text visibility */}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => !isTransitioning && setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            disabled={isTransitioning}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-20 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
        {current + 1} / {slides.length}
      </div>
    </div>
  );
};

export default Carousel;
