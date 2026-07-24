"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Sparkles,
  Rocket,
  GraduationCap,
  BookOpen,
  Users,
  Building,
  Target,
  Award,
  ArrowRight,
  Atom,
  Telescope,
  GitBranch,
  Code2
} from "lucide-react";
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";
import SentientMeshCanvas from "@/components/SentientMeshCanvas";
import JigsawPuzzleSphereCanvas from "@/components/JigsawPuzzleSphereCanvas";

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export default function AboutPage() {
  const [activeMeshShape, setActiveMeshShape] = useState<string>("black-hole");

  return (
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 font-sans transition-colors duration-300">
      <UniversalNavbar />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-24">
        {/* 1. HERO SECTION: VIBRANT YELLOW HERO CONTAINER CARD */}
        <section className="flex justify-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full rounded-[2.5rem] bg-[#FFEA4B] text-black p-10 sm:p-16 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl overflow-hidden"
          >
            {/* Subtle background grid pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

            <h1 className="relative z-10 text-4xl sm:text-6xl font-black tracking-tight text-black leading-tight text-center">
              Democratizing Space Science <br />
              <span className="font-normal text-zinc-900">Through Sentient Visualization</span>
            </h1>

            <p className="relative z-10 text-base sm:text-lg text-zinc-900 max-w-3xl mx-auto leading-relaxed font-medium text-center">
              The Ethiopian Space Science Society (ESSS) Science Portal is an open-access platform designed to bring astrophysics, orbital mechanics, and satellite technology to life. By pairing real-time data visualizers with our 3D Sentient Mesh topological engine, we transform complex space physics into intuitive, hands-on learning tools.
            </p>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-6 sm:pt-8 mx-auto">
              <Link
                href="/apps"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-black text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105"
              >
                <span>LAUNCH SPACE APPS</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/labs"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-black text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-black/10 transition-all cursor-pointer"
              >
                <span>EXPLORE SCIENCE LABS</span>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* 2. SENTIENT MESH & EDUCATOR SECTION (Flat on Page BG with Black Hole Mesh) */}
        <section className="relative w-full min-h-[420px] sm:min-h-[460px] flex flex-col items-center justify-center text-center py-8">
          {/* Background 3D Sentient Mesh Canvas */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40 light:opacity-30">
            <SentientMeshCanvas
              activeObject="black-hole"
              meshScale={0.5}
              meshPosition={[0, 0, 0]}
              cameraFov={50}
              autoRotate={true}
              interactive={false}
              bgColor="bg-transparent"
            />
          </div>

          {/* Overlaid Centered Content Directly on Page BG */}
          <div className="relative z-20 w-full max-w-3xl mx-auto px-4 text-center flex flex-col items-center justify-center space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFEA4B] text-black font-mono font-bold text-xs uppercase tracking-widest shadow-sm">
              <GraduationCap size={16} /> FOR EDUCATORS & LABS
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 leading-tight">
              3D Topological Physics for the Classroom
            </h2>

            <p className="text-base sm:text-lg text-zinc-300 light:text-zinc-700 leading-relaxed max-w-2xl mx-auto font-medium">
              Empowering educators, students, and space school clubs with zero-installation 3D WebGL models. Live interactive manifolds make abstract gravitational fields, planetary bodies, and orbital geometry effortless to explain.
            </p>
          </div>
        </section>

        {/* 3. PLATFORM PILLARS (Centered Directly on BG) */}
        <section className="py-4 space-y-10 text-center">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[#FFEA4B] light:text-zinc-900 uppercase tracking-widest block">
              // CORE PLATFORM
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white light:text-zinc-900 text-center">
              Integrated Space Ecosystem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#FFEA4B] text-black flex items-center justify-center font-bold shadow-md">
                <Rocket size={22} />
              </div>
              <h3 className="text-xl font-bold text-white light:text-zinc-900 text-center">Space Applications</h3>
              <p className="text-sm text-zinc-400 light:text-zinc-600 leading-relaxed text-center max-w-xs">
                Real-time space weather, satellite tracking, and solar calculators built on Hewa+ framework.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#FFEA4B] text-black flex items-center justify-center font-bold shadow-md">
                <Atom size={22} />
              </div>
              <h3 className="text-xl font-bold text-white light:text-zinc-900 text-center">Interactive Labs</h3>
              <p className="text-sm text-zinc-400 light:text-zinc-600 leading-relaxed text-center max-w-xs">
                Hands-on physics experiments covering atmospheric drag, gravity wells, and photometric curves.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#FFEA4B] text-black flex items-center justify-center font-bold shadow-md">
                <BookOpen size={22} />
              </div>
              <h3 className="text-xl font-bold text-white light:text-zinc-900 text-center">Research & Blogs</h3>
              <p className="text-sm text-zinc-400 light:text-zinc-600 leading-relaxed text-center max-w-xs">
                Scientific articles, technical guides, and space science news curated by ESSS specialists.
              </p>
            </div>
          </div>
        </section>

        {/* 4. ESSS STATS (Directly on BG - No Card / No Shadow) */}
        <section className="py-6 border-t border-b border-zinc-800/80 light:border-zinc-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <Users className="w-6 h-6 text-[#FFEA4B] light:text-zinc-900 mx-auto" />
              <div className="text-4xl font-black text-white light:text-zinc-900">20,000+</div>
              <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Individual Members</div>
            </div>
            <div className="space-y-2">
              <Target className="w-6 h-6 text-[#FFEA4B] light:text-zinc-900 mx-auto" />
              <div className="text-4xl font-black text-white light:text-zinc-900">32</div>
              <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Branch Associations</div>
            </div>
            <div className="space-y-2">
              <Building className="w-6 h-6 text-[#FFEA4B] light:text-zinc-900 mx-auto" />
              <div className="text-4xl font-black text-white light:text-zinc-900">58+</div>
              <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Institutional Members</div>
            </div>
            <div className="space-y-2">
              <Award className="w-6 h-6 text-[#FFEA4B] light:text-zinc-900 mx-auto" />
              <div className="text-4xl font-black text-white light:text-zinc-900">100+</div>
              <div className="text-xs font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Space School Clubs</div>
            </div>
          </div>
        </section>

        {/* 5. OPEN SOURCE & MODULAR COMMUNITY SECTION (With 3D Wikipedia-Style Jigsaw Sphere Background) */}
        <section className="relative w-full min-h-[460px] sm:min-h-[500px] flex flex-col items-center justify-center text-center py-8">
          {/* Background 3D Wikipedia-Style Jigsaw Puzzle Sphere */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-45 light:opacity-35">
            <JigsawPuzzleSphereCanvas />
          </div>

          <div className="relative z-20 flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFEA4B] text-black font-mono font-bold text-xs uppercase tracking-widest shadow-md">
              <Code2 size={16} /> OPEN SOURCE PAN-AFRICAN INITIATIVE
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-white light:text-zinc-900 leading-tight text-center">
              Modular Apps & Community Contribution
            </h2>

            <p className="text-base sm:text-lg text-zinc-300 light:text-zinc-700 leading-relaxed text-center font-medium max-w-2xl">
              We empower educators, scientists, and software developers across Africa to build and contribute custom modular 3D apps and interactive science labs like pieces of an evolving puzzle — democratizing astronomy education for every student.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://github.com/ESSS-Ethiopia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#FFEA4B] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-yellow-300 transition-all cursor-pointer shadow-lg hover:scale-105"
              >
                <GithubIcon size={18} />
                <span>CONTRIBUTE ON GITHUB</span>
              </a>
              <Link
                href="/apps"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 light:hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <span>EXPLORE MODULAR APPS</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <UniversalFooter />
    </div>
  );
}
