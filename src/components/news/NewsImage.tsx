"use client";

import { useState } from "react";

interface NewsImageProps {
  articleId: string;
  alt: string;
  className?: string;
}

export function NewsImage({ articleId, alt, className = "" }: NewsImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`w-full h-full bastion-gradient flex items-center justify-center ${className}`}>
        <span className="material-symbols-outlined text-5xl text-brand-accent/40">newspaper</span>
      </div>
    );
  }

  return (
    <img
      src={`/api/news-image?id=${articleId}`}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
