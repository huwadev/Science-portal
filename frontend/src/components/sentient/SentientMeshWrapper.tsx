"use client";

import dynamic from 'next/dynamic';

const SentientMesh = dynamic(
  () => import('sentient-mesh').then((mod) => mod.SentientMesh),
  { ssr: false }
);

interface SentientMeshWrapperProps {
  activeObject?: any;
  themeColor?: string;
  intensity?: number;
  complexity?: 'low' | 'medium' | 'high';
}

export default function SentientMeshWrapper({
  activeObject = 'sphere',
  themeColor = '#00d2ff',
  intensity = 0.25,
  complexity = 'high',
}: SentientMeshWrapperProps) {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden opacity-25">
      <SentientMesh
        activeObject={activeObject}
        complexity={complexity}
        darkMode={true}
        themeColor={themeColor}
        gradientAngle={135}
        gradientSpread={0.6}
        gradientFalloff={0.4}
        breathType="individual-nodes"
        intensity={intensity}
        cadence={0.3}
      />
    </div>
  );
}
