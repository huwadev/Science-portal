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
    <div className="min-h-screen bg-black text-zinc-100 transition-colors duration-200">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>RETURN TO PORTAL</span>
            </Link>
            <span className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-zinc-200" />
              <h1 className="text-sm font-extrabold tracking-wider uppercase font-outfit text-white">Newsletter & Blogs</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-zinc-300"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun style={{ width: "18px", height: "18px", color: "#ffcc00" }} /> : <Moon style={{ width: "18px", height: "18px", color: "#ffffff" }} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-mono font-bold uppercase tracking-widest">
            <BookOpen size={14} /> ESSS Publications
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Space Science <span className="text-zinc-400">Publications</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
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
                    ? "bg-white text-black shadow-lg"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
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
              className="border border-zinc-800 bg-zinc-950/80 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-zinc-600 transition-all group shadow-xl"
            >
              <div>
                <div className="relative h-60 w-full overflow-hidden">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md backdrop-blur-md">
                    {art.category}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {art.date}</span>
                    <span>•</span>
                    <span>{art.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-zinc-300 transition-colors leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {art.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0 flex items-center justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <User size={12} /> {art.author}
                </span>

                <button className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md">
                  <span>READ ARTICLE</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
