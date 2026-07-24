"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SentientMesh } from "sentient-mesh";

import { usePortalStore } from "@/store/usePortalStore";

export interface SentientMeshCanvasProps {
  className?: string;
  activeObject?: string;
  svgUrl?: string;
  themeColor?: string;
  autoRotate?: boolean;
  darkMode?: boolean;
  bgColor?: string;
  interactive?: boolean;
  complexity?: "low" | "medium" | "high";
  cameraFov?: number;
  cameraPosition?: [number, number, number];
  meshScale?: number;
  meshPosition?: [number, number, number];
  renderOnHoverOnly?: boolean;
  isHovered?: boolean;
}

// Crisp Vector Snapshot Placeholder for Instant Foveated Card Rendering
const MeshSnapshotSvg: React.FC<{ activeObject?: string; svgUrl?: string; themeColor?: string; bgColor?: string; isLight?: boolean }> = ({
  activeObject = "mobius-strip",
  svgUrl,
  themeColor = "#FFEA4B",
  bgColor = "bg-zinc-950 light:bg-white",
  isLight = false
}) => {
  const strokeColor = isLight ? "#000000" : themeColor;

  return (
    <div className={`relative w-full h-full ${bgColor} flex items-center justify-center overflow-hidden transition-all duration-500`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,234,75,0.08)_0%,transparent_70%)] light:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.04)_0%,transparent_70%)] pointer-events-none" />
      
      {svgUrl ? (
        <img
          src={svgUrl}
          alt="Mesh Snapshot Vector"
          className={`w-48 h-48 sm:w-56 sm:h-56 object-contain opacity-95 transition-transform duration-700 hover:scale-105 ${isLight ? "brightness-0" : "drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]"}`}
        />
      ) : activeObject === "sphere" ? (
        /* 3D Geodesic Wireframe Sphere Snapshot */
        <svg className={`w-40 h-40 transition-transform duration-700 hover:scale-110 drop-shadow-2xl ${isLight ? "text-black" : "text-[#FFEA4B]"}`} viewBox="0 0 100 100" fill="none" stroke={strokeColor} strokeWidth="0.8" strokeOpacity="0.85">
          <circle cx="50" cy="50" r="38" strokeDasharray="3 2" opacity="0.6" />
          <ellipse cx="50" cy="50" rx="38" ry="14" strokeWidth="0.9" />
          <ellipse cx="50" cy="50" rx="14" ry="38" strokeWidth="0.9" />
          <ellipse cx="50" cy="50" rx="30" ry="30" strokeDasharray="4 2" opacity="0.7" />
          <line x1="50" y1="12" x2="50" y2="88" strokeDasharray="2 2" opacity="0.5" />
          <line x1="12" y1="50" x2="88" y2="50" strokeDasharray="2 2" opacity="0.5" />
          <circle cx="50" cy="50" r="3" fill={strokeColor} opacity="0.9" />
        </svg>
      ) : activeObject === "hyperboloid" || activeObject === "black-hole" || activeObject === "low-poly-fabric" ? (
        /* Hyperboloid / Low-Poly Fabric Mesh Snapshot */
        <svg className={`w-44 h-44 transition-transform duration-700 hover:scale-110 drop-shadow-2xl ${isLight ? "text-black" : "text-[#FFEA4B]"}`} viewBox="0 0 100 100" fill="none" stroke={strokeColor} strokeWidth="0.8" strokeOpacity="0.85">
          <path d="M20,20 C35,45 35,55 20,80 M80,20 C65,45 65,55 80,80" strokeWidth="1" />
          <ellipse cx="50" cy="20" rx="30" ry="8" strokeWidth="0.9" />
          <ellipse cx="50" cy="50" rx="16" ry="5" strokeWidth="0.9" />
          <ellipse cx="50" cy="80" rx="30" ry="8" strokeWidth="0.9" />
          <line x1="20" y1="20" x2="80" y2="80" strokeDasharray="2 2" opacity="0.4" />
          <line x1="80" y1="20" x2="20" y2="80" strokeDasharray="2 2" opacity="0.4" />
          <polygon points="50,20 65,45 50,50 35,45" fill={strokeColor} fillOpacity="0.1" />
          <polygon points="50,80 65,55 50,50 35,55" fill={strokeColor} fillOpacity="0.1" />
        </svg>
      ) : (
        /* Solar System Orbital Topology Wireframe Snapshot */
        <svg className={`w-44 h-44 transition-transform duration-700 hover:scale-110 drop-shadow-2xl ${isLight ? "text-black" : "text-[#FFEA4B]"}`} viewBox="0 0 100 100" fill="none" stroke={strokeColor} strokeWidth="0.8" strokeOpacity="0.85">
          <ellipse cx="50" cy="50" rx="42" ry="20" strokeWidth="0.9" transform="rotate(-15 50 50)" />
          <ellipse cx="50" cy="50" rx="28" ry="12" strokeDasharray="3 2" transform="rotate(-15 50 50)" opacity="0.7" />
          <ellipse cx="50" cy="50" rx="14" ry="6" strokeWidth="1" transform="rotate(-15 50 50)" />
          <circle cx="50" cy="50" r="5" fill={strokeColor} />
          <circle cx="78" cy="42" r="3" fill={strokeColor} opacity="0.9" />
          <circle cx="32" cy="58" r="2.5" fill={strokeColor} opacity="0.7" />
          <circle cx="60" cy="36" r="2" fill={strokeColor} opacity="0.8" />
        </svg>
      )}
    </div>
  );
};

export const SentientMeshCanvasInner: React.FC<SentientMeshCanvasProps> = ({
  className = "",
  activeObject = "mobius-strip",
  svgUrl,
  themeColor = "#FFEA4B",
  autoRotate = true,
  darkMode = true,
  bgColor = "bg-zinc-950 light:bg-white",
  interactive = true,
  complexity = "medium",
  cameraFov = 45,
  cameraPosition = [0, 0, 4.2],
  meshScale = 1,
  meshPosition = [0, 0, 0],
  renderOnHoverOnly = false,
  isHovered = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const storeTheme = usePortalStore((state) => state.theme);
  const isLight = storeTheme === "light";
  const effectiveDarkMode = isLight ? false : darkMode;
  const effectiveThemeColor = isLight ? "#000000" : themeColor;

  // 1. Viewport IntersectionObserver
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 2. Tab Visibility Check
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Foveated Rendering Rule: Render WebGL only when in view, tab visible AND (if hover-only mode: when card is actively hovered)
  const shouldRenderWebGL = isInView && isTabVisible && (!renderOnHoverOnly || isHovered);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${bgColor} overflow-hidden ${interactive ? "" : "pointer-events-none"} ${className}`}
    >
      {!shouldRenderWebGL ? (
        <MeshSnapshotSvg activeObject={activeObject} svgUrl={svgUrl} themeColor={effectiveThemeColor} bgColor={bgColor} isLight={isLight} />
      ) : (
        <Canvas
          camera={{ position: cameraPosition, fov: cameraFov }}
          dpr={1}
          frameloop="always"
          gl={{ powerPreference: "high-performance", antialias: false, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <group scale={[meshScale, meshScale, meshScale]} position={meshPosition}>
            <SentientMesh
              activeObject={activeObject as any}
              svgUrl={svgUrl}
              complexity={complexity}
              darkMode={effectiveDarkMode}
              themeColor={effectiveThemeColor}
              gradientAngle={45}
              gradientSpread={0.5}
              gradientFalloff={0.5}
              breathType="individual-nodes"
              intensity={0.18}
              cadence={0.25}
            />
          </group>
          {(interactive || autoRotate) && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={interactive}
              autoRotate={autoRotate}
              autoRotateSpeed={1.5}
            />
          )}
        </Canvas>
      )}
    </div>
  );
};

export const SentientMeshCanvas = dynamic<SentientMeshCanvasProps>(
  () => Promise.resolve(SentientMeshCanvasInner),
  {
    ssr: false,
    loading: () => <MeshSnapshotSvg bgColor="bg-zinc-950 light:bg-white" />
  }
);

export default SentientMeshCanvas;
