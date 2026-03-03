"use client";

import { useEffect, useRef } from "react";

interface AbeikuEmbedProps {
  hotel: string;
}

export function AbeikuEmbed({ hotel }: AbeikuEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://abeiku.netlify.app/embed.js";
    script.dataset.hotel = hotel;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [hotel]);

  return <div ref={containerRef} />;
}
