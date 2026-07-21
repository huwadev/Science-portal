"use client";

import { useEffect } from "react";
import { usePortalStore } from "@/store/usePortalStore";

export default function ThemeHydrator() {
  const theme = usePortalStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  return null;
}
