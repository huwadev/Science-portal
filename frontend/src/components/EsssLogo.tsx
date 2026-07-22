"use client";

import React from "react";
import { usePortalStore } from "@/store/usePortalStore";

interface EsssLogoProps {
  className?: string;
  height?: number | string;
  mode?: "dark" | "light";
  lang?: "en" | "am";
}

export const EsssLogo: React.FC<EsssLogoProps> = ({
  className = "",
  height = 40,
  mode,
  lang
}) => {
  return (
    <>
      {/* Light Mode Logo (Original) */}
      <img
        src="/esss-logo.png"
        alt="ESSS Logo"
        style={{ height }}
        className={`w-auto object-contain transition-all duration-200 select-none block dark:hidden ${className}`}
      />
      {/* Dark Mode Logo (White Text) */}
      <img
        src="/esss-logo-white.png"
        alt="ESSS Logo"
        style={{ height }}
        className={`w-auto object-contain transition-all duration-200 select-none hidden dark:block ${className}`}
      />
    </>
  );
};

export default EsssLogo;
