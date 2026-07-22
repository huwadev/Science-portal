"use client";

import React from "react";
import Link from "next/link";

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
  aspectRatio = "h-[380px] sm:h-[420px]"
}) => {
  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-950 light:bg-[#f5f5f5] border border-zinc-800/80 light:border-zinc-200 shadow-xl transition-all duration-300 hover:border-zinc-600 light:hover:border-zinc-400 hover:shadow-2xl cursor-pointer ${className}`}
    >
      {/* Top Image Container */}
      <div className={`relative w-full overflow-hidden ${aspectRatio}`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top Badges */}
        {badge && (
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 rounded-lg bg-black/75 light:bg-white/90 backdrop-blur-md border border-white/20 light:border-black/10 text-white light:text-zinc-800 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider shadow-lg">
              {badge}
            </span>
          </div>
        )}

        {category && (
          <div className="absolute top-4 right-4 z-20">
            <span className="px-3 py-1 rounded-lg bg-black/75 light:bg-white/90 backdrop-blur-md border border-white/20 light:border-black/10 text-zinc-300 light:text-zinc-600 text-[10px] sm:text-xs font-mono font-medium tracking-wider shadow-lg">
              {category}
            </span>
          </div>
        )}

        {/* Dark Gradient Overlay over image for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-15" />

        {/* Optional Description overlay */}
        {description && (
          <div className="absolute bottom-4 left-5 right-5 z-10 space-y-2 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-2">
            <p className="text-xs sm:text-sm text-zinc-200 font-medium line-clamp-2 leading-relaxed drop-shadow-md">
              {description}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Banner */}
      <div className="relative w-full px-5 py-4 sm:px-6 sm:py-5 bg-zinc-950/95 light:bg-[#f5f5f5] border-t border-white/10 light:border-zinc-200 transition-all duration-300 group-hover:bg-[#FBE04C] light:group-hover:bg-[#FBE04C] group-hover:border-[#FBE04C] light:group-hover:border-[#FBE04C] flex items-center justify-between gap-4">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white light:text-zinc-900 group-hover:text-black transition-colors duration-300 font-sans line-clamp-1">
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
  );
};

export default SiteCard;
