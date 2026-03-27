"use client";

import { useState, useCallback } from "react";

interface CardImageCarouselProps {
  images: string[];
  alt: string;
}

export function CardImageCarousel({ images, alt }: CardImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bastion-gradient">
        <span className="material-symbols-outlined text-5xl text-brand-accent/40">newspaper</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Current Image */}
      <img
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows — only show when multiple images */}
      {images.length > 1 && (
        <>
          {/* Previous Arrow */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-brand-primary flex items-center justify-center shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            aria-label="Previous image"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          {/* Next Arrow */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-brand-primary flex items-center justify-center shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            aria-label="Next image"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-4 shadow-sm"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
