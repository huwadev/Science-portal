"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePortalStore } from "@/store/usePortalStore";
import {
  Sun,
  Moon,
  Search,
  ArrowLeft,
  BookOpen,
  Calendar,
  User,
  ArrowRight
} from "lucide-react";
import SiteCard from "@/components/SiteCard";
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";

interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  image: string;
  summary: string;
}

const ARTICLES: Article[] = [
  {
    id: 1,
    title: "Ethiopian Space Science Society Advances Regional Astronomy & Deep Sky Exploration",
    category: "Exclusive Newsletter",
    date: "July 2026",
    readTime: "5 min read",
    author: "ESSS Editorial Team",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    summary: "Discover the latest scientific milestones, astronomical observations, and upcoming satellite missions across East Africa."
  },
  {
    id: 2,
    title: "Mapping Exoplanets & Binary Star Systems: Insights from High-Altitude Observatories",
    category: "Research Highlights",
    date: "June 2026",
    readTime: "7 min read",
    author: "Dr. Biruk Tadesse",
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop",
    summary: "In-depth transit photometries and spectral analysis uncovering potentially habitable exoplanets beyond our Solar System."
  },
  {
    id: 3,
    title: "Next-Gen Satellite Doppler Tracking & Orbital Mechanics for Space Education",
    category: "Tech & Innovation",
    date: "May 2026",
    readTime: "4 min read",
    author: "Space Engineering Div",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop",
    summary: "Empowering students and researchers with real-time orbital trajectory modeling and satellite telemetry tools."
  },
  {
    id: 4,
    title: "Solar Syzygy & Eclipse Geometry: Understanding Obscuration Pathways",
    category: "Planetary Science",
    date: "April 2026",
    readTime: "6 min read",
    author: "Astrophysics Lab",
    image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=800&auto=format&fit=crop",
    summary: "A mathematical breakdown of solar and lunar eclipse predictions using ephemerides calculation models."
  }
];

export default function BlogsPage() {
  const { theme, setTheme } = usePortalStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Exclusive Newsletter", "Research Highlights", "Tech & Innovation", "Planetary Science"];

  const filteredArticles = ARTICLES.filter((art) => {
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 font-sans">
      <UniversalNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 light:border-zinc-200 bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 text-xs font-mono font-bold uppercase tracking-widest">
            <BookOpen size={14} /> ESSS Publications
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white light:text-zinc-900">
            Space Science <span className="text-zinc-400 light:text-zinc-500">Publications</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 light:text-zinc-600">
            Read the latest newsletter editions, research papers, and technical breakthroughs published by the Ethiopian Space Science Society.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#FFEA4B] text-black shadow-lg shadow-[#FFEA4B]/20"
                    : "bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-700 light:hover:border-zinc-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 light:border-zinc-300 bg-zinc-900 light:bg-zinc-100 pl-9 pr-4 py-2 text-xs font-medium text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-600 light:focus:border-zinc-400 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 light:text-zinc-400 w-4 h-4" />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredArticles.map((art) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SiteCard
                title={art.title}
                description={art.summary}
                image={art.image}
                href="#"
                badge={art.category}
                category={`${art.date} • ${art.readTime}`}
                aspectRatio="h-[340px] sm:h-[380px]"
              />
            </motion.div>
          ))}
        </div>
      </main>
      <UniversalFooter />
    </div>
  );
}
