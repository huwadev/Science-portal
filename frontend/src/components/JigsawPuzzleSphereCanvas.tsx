"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SentientShaderMaterial } from "sentient-mesh";
import { usePortalStore } from "@/store/usePortalStore";

extend({ SentientShaderMaterial });

// Generates an authentic 3D Wikipedia-Style Jigsaw Puzzle Sphere with interlocking tabs and missing top crown pieces
export function createJigsawSphereGeometry(radius = 1.85, numLat = 7, numLon = 11): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const indices: number[] = [];

  // Map of missing pieces to reproduce the Wikipedia logo top-crown opening
  // (Missing pieces at top latitude rings)
  const isPieceMissing = (i: number, j: number): boolean => {
    if (i === 0) return true; // Entire top pole cap is open
    if (i === 1) return j % 3 !== 0; // Missing 2 out of 3 top-ring pieces
    if (i === 2) return j === 2 || j === 5 || j === 9; // Irregular top jagged gap
    return false; // Middle and bottom rings are fully intact
  };

  // Helper to map spherical coordinates (phi, theta) to 3D point on unit sphere
  const spherePos = (phi: number, theta: number, r: number = radius): THREE.Vector3 => {
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  };

  // Generate edge points with a bulbous jigsaw tab in the middle
  const generateTabbedEdgePoints = (
    phiA: number, thetaA: number,
    phiB: number, thetaB: number,
    tabDirection: number, // +1 or -1 for male/female tab orientation
    subdivisions = 16
  ): THREE.Vector3[] => {
    const edgePts: THREE.Vector3[] = [];
    const dPhi = phiB - phiA;
    const dTheta = thetaB - thetaA;

    // Perpendicular vector for tab protrusion
    const perpPhi = -dTheta;
    const perpTheta = dPhi;
    const lenPerp = Math.sqrt(perpPhi * perpPhi + perpTheta * perpTheta) || 1;
    const normPerpPhi = (perpPhi / lenPerp) * tabDirection;
    const normPerpTheta = (perpTheta / lenPerp) * tabDirection;

    for (let k = 0; k <= subdivisions; k++) {
      const t = k / subdivisions;

      let pPhi = phiA + t * dPhi;
      let pTheta = thetaA + t * dTheta;

      // Inject bulbous jigsaw tab curve between t = 0.35 and t = 0.65
      if (t >= 0.35 && t <= 0.65) {
        const tabT = (t - 0.35) / 0.30; // 0.0 to 1.0 within tab region
        // Omega-shaped tab knob profile
        const angle = (tabT - 0.5) * Math.PI; // -PI/2 to PI/2
        const tabHeight = Math.cos(angle) * 0.08; // Protrusion out/in
        const tabWidthOffset = Math.sin(angle * 2) * 0.02; // Bulbous width expansion

        pPhi += normPerpPhi * tabHeight + (dPhi / Math.sqrt(dPhi*dPhi + dTheta*dTheta || 1)) * tabWidthOffset;
        pTheta += normPerpTheta * tabHeight + (dTheta / Math.sqrt(dPhi*dPhi + dTheta*dTheta || 1)) * tabWidthOffset;
      }

      edgePts.push(spherePos(pPhi, pTheta));
    }
    return edgePts;
  };

  // Generate each intact puzzle piece tile as a distinct boundary outline + mesh surface
  for (let i = 0; i < numLat; i++) {
    const phi1 = ((i + 0.5) / (numLat + 1)) * Math.PI;
    const phi2 = ((i + 1.5) / (numLat + 1)) * Math.PI;

    for (let j = 0; j < numLon; j++) {
      if (isPieceMissing(i, j)) continue; // Skip missing top pieces

      const theta1 = (j / numLon) * Math.PI * 2;
      const theta2 = ((j + 1) / numLon) * Math.PI * 2;

      // Deterministic tab directions so adjacent pieces interlock (+1 male, -1 female)
      const topTabDir = (i + j) % 2 === 0 ? 1 : -1;
      const rightTabDir = (i * 3 + j) % 2 === 0 ? 1 : -1;
      const bottomTabDir = -topTabDir;
      const leftTabDir = -rightTabDir;

      // 4 Edge Boundaries of the puzzle piece
      const topEdge = generateTabbedEdgePoints(phi1, theta1, phi1, theta2, topTabDir);
      const rightEdge = generateTabbedEdgePoints(phi1, theta2, phi2, theta2, rightTabDir);
      const bottomEdge = generateTabbedEdgePoints(phi2, theta2, phi2, theta1, bottomTabDir);
      const leftEdge = generateTabbedEdgePoints(phi2, theta1, phi1, theta1, leftTabDir);

      // Assemble all boundary points for this piece
      const pieceBoundary = [...topEdge, ...rightEdge, ...bottomEdge, ...leftEdge];

      // Add center point for radial triangulation of the puzzle piece face
      const centerPhi = (phi1 + phi2) / 2;
      const centerTheta = (theta1 + theta2) / 2;
      const centerPt = spherePos(centerPhi, centerTheta);

      const centerIndex = points.length;
      points.push(centerPt);

      const startIndex = points.length;
      for (const pt of pieceBoundary) {
        points.push(pt);
      }

      // Triangulate piece face (fan from center to boundary points)
      const numPts = pieceBoundary.length;
      for (let k = 0; k < numPts; k++) {
        const nextK = (k + 1) % numPts;
        indices.push(centerIndex, startIndex + k, startIndex + nextK);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  const positionArray = new Float32Array(points.length * 3);
  for (let k = 0; k < points.length; k++) {
    positionArray[k * 3] = points[k].x;
    positionArray[k * 3 + 1] = points[k].y;
    positionArray[k * 3 + 2] = points[k].z;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.center();

  return geometry;
}

interface JigsawMeshProps {
  themeColor: string;
  isLight: boolean;
  intensity?: number;
  cadence?: number;
}

const JigsawMeshInner: React.FC<JigsawMeshProps> = ({
  themeColor = "#FFEA4B",
  isLight = false,
  intensity = 0.22,
  cadence = 0.35
}) => {
  const materialRef = useRef<any>(null);

  const geometry = useMemo(() => {
    const geom = createJigsawSphereGeometry(1.85, 7, 11);
    return geom;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
    }
  });

  const effectiveThemeColor = isLight ? "#000000" : themeColor;

  return (
    <mesh geometry={geometry} rotation={[0.3, 0, 0]}>
      {/* @ts-ignore */}
      <sentientShaderMaterial
        ref={materialRef}
        wireframe={true}
        transparent={true}
        uTime={0.0}
        uDarkMode={isLight ? 0.0 : 1.0}
        uThemeColor={new THREE.Color(effectiveThemeColor)}
        uGradientAngle={45}
        uGradientSpread={0.5}
        uGradientFalloff={0.5}
        uBreathType={0.0}
        uIntensity={intensity}
        uCadence={cadence}
        uIsSvg={0.0}
      />
    </mesh>
  );
};

export interface JigsawPuzzleSphereCanvasProps {
  className?: string;
  themeColor?: string;
  bgColor?: string;
}

export const JigsawPuzzleSphereCanvasInner: React.FC<JigsawPuzzleSphereCanvasProps> = ({
  className = "",
  themeColor = "#FFEA4B",
  bgColor = "bg-transparent"
}) => {
  const storeTheme = usePortalStore((state) => state.theme);
  const isLight = storeTheme === "light";

  return (
    <div className={`relative w-full h-full ${bgColor} overflow-hidden pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 48 }}
        dpr={1}
        frameloop="always"
        gl={{ powerPreference: "high-performance", antialias: false, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        
        <JigsawMeshInner themeColor={themeColor} isLight={isLight} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={true}
          autoRotateSpeed={1.6}
        />
      </Canvas>
    </div>
  );
};

export const JigsawPuzzleSphereCanvas = dynamic<JigsawPuzzleSphereCanvasProps>(
  () => Promise.resolve(JigsawPuzzleSphereCanvasInner),
  { ssr: false }
);

export default JigsawPuzzleSphereCanvas;
