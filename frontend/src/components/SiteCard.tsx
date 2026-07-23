"use client";

import React from "react";
import Link from "next/link";
import SentientMeshCanvas from "@/components/SentientMeshCanvas";

export interface SiteCardProps {
  id?: string;
  title: string;
  titleAm?: string;
  description?: string;
  image: string;
  href: string;
  badge?: string;
  category?: string;
  features?: string[];
  className?: string;
  aspectRatio?: string;
  useSentientMesh?: boolean;
  meshShape?: string;
  svgUrl?: string;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  title,
  description,
  image,
  href,
  badge,
  category,
  features,
  className = "",
  aspectRatio = "h-[380px] sm:h-[420px]",
  useSentientMesh = false,
  meshShape,
  svgUrl
}) => {
  const [tilt, setTilt] = React.useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = Number((((y - centerY) / centerY) * -12).toFixed(2));
    const rotateY = Number((((x - centerX) / centerX) * 12).toFixed(2));

    setTilt({ rotateX, rotateY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, isHovered: false });
  };

  return (
    <div className="perspective-1000 w-full" style={{ perspective: "1000px" }}>
      <Link
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${tilt.isHovered ? "scale3d(1.02, 1.02, 1.02)" : "scale3d(1, 1, 1)"}`,
          transition: tilt.isHovered ? "transform 0.1s cubic-bezier(0.03, 0.98, 0.52, 0.99)" : "transform 0.5s ease-out"
        }}
        className={`group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 light:bg-[#f5f5f5] border border-zinc-800/80 light:border-zinc-200 shadow-xl hover:border-[#FFEA4B]/60 light:hover:border-zinc-400 hover:shadow-2xl cursor-pointer ${className}`}
      >
        {/* Top Image / Sentient Mesh Container */}
        <div className={`relative w-full overflow-hidden ${aspectRatio}`} style={{ transform: "translateZ(20px)" }}>
          {useSentientMesh ? (
            <SentientMeshCanvas
              activeObject={meshShape}
              svgUrl={svgUrl}
              meshScale={1.3}
              cameraFov={38}
              autoRotate={true}
              renderOnHoverOnly={true}
              isHovered={tilt.isHovered}
            />
          ) : (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover filter grayscale contrast-125 brightness-90 group-hover:grayscale-0 group-hover:contrast-110 transition-all duration-500 ease-out group-hover:scale-105"
            />
          )}

          {/* High-contrast yellow glow overlay on hover */}
          <div className="absolute inset-0 bg-[#FFEA4B]/0 group-hover:bg-[#FFEA4B]/15 transition-all duration-500 pointer-events-none mix-blend-overlay z-10" />

          {/* Bottom-Up Yellow Gradient Overlay extending from hard yellow bottom banner into black container on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFEA4B]/80 via-[#FFEA4B]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-15" />

          {/* Top Badges */}
          {badge && (
            <div className="absolute top-4 left-4 z-20" style={{ transform: "translateZ(30px)" }}>
              <span className="px-3 py-1 rounded-lg bg-black/75 light:bg-white/90 backdrop-blur-md border border-white/20 light:border-black/10 text-white light:text-zinc-800 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider shadow-lg">
                {badge}
              </span>
            </div>
          )}

          {category && (
            <div className="absolute top-4 right-4 z-20" style={{ transform: "translateZ(30px)" }}>
              <span className="px-3 py-1 rounded-lg bg-black/75 light:bg-white/90 backdrop-blur-md border border-white/20 light:border-black/10 text-zinc-300 light:text-zinc-600 text-[10px] sm:text-xs font-mono font-medium tracking-wider shadow-lg">
                {category}
              </span>
            </div>
          )}

          {/* Dark Gradient Overlay over image for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-15" />

          {/* Optional Description overlay */}
          {description && (
            <div className="absolute bottom-4 left-5 right-5 z-10 space-y-2 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-2" style={{ transform: "translateZ(25px)" }}>
              <p className="text-xs sm:text-sm text-zinc-200 font-medium line-clamp-2 leading-relaxed drop-shadow-md">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Banner (Hard Yellow on Hover) */}
        <div className="relative w-full px-5 py-4 sm:px-6 sm:py-5 bg-zinc-950/95 light:bg-[#f5f5f5] border-t border-white/10 light:border-zinc-200 transition-all duration-300 group-hover:bg-[#FFEA4B] light:group-hover:bg-[#FFEA4B] group-hover:border-[#FFEA4B] light:group-hover:border-[#FFEA4B] flex items-center justify-between gap-4" style={{ transform: "translateZ(25px)" }}>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-white light:text-zinc-900 group-hover:text-black transition-colors duration-300 font-sans line-clamp-2 leading-snug">
            {title}
          </h3>

          {/* Arrow Container: Initial Up-Right Arrow ↗, Hover Right Arrow → */}
          <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-transform duration-300">
            {/* Initial Up-Right Arrow ↗ (Visible when NOT hovered) */}
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-white light:text-zinc-900 transition-all duration-300 group-hover:hidden"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>

            {/* Hover Horizontal Right Arrow → (Visible on HOVER in BLACK) */}
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-black hidden group-hover:block transition-all duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="13 5 20 12 13 19" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SiteCard;
