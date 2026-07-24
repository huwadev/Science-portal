"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePortalStore } from "@/store/usePortalStore";
import { ArrowRight, BookOpen, Clock, Code, Compass, FileText, Globe, Layers, Search, AlertCircle, Loader2, Calendar, Sparkles, Download } from "lucide-react";
import UniversalNavbar from "@/components/UniversalNavbar";
import UniversalFooter from "@/components/UniversalFooter";
import SentientMeshCanvas from "@/components/SentientMeshCanvas";
import { fetchScienceBlogs, BlogArticle } from "@/lib/api";

const CATEGORIES = [
  { label: "All", slug: "all" },
  { label: "Astronomy", slug: "astronomy" },
  { label: "Aerospace", slug: "aerospace" },
  { label: "Satellites", slug: "satellites" },
];

const FALLBACK_ARTICLES: BlogArticle[] = [
  {
    id: 101,
    title: "Ethiopian Space Science Society Advances Regional Astronomy & Deep Sky Exploration",
    slug: "ethiopian-space-science-society-advances-regional-astronomy",
    excerpt: "Discover the latest scientific milestones, astronomical observations, and upcoming satellite missions across East Africa.",
    cover_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    category: { name: "Astronomy", slug: "astronomy" },
    categories: [{ name: "Astronomy", slug: "astronomy" }],
    tags: ["Astronomy", "Deep Sky"],
    read_time: 5,
    published_at: "2026-07-01T00:00:00Z",
    published_at_formatted: "Jul 2026",
    is_featured: true,
    is_exclusive: false,
    author: { name: "ESSS Editorial Team", avatar: null, slug: "esss-team" },
    stats: { views: 1250, likes: 98 }
  },
  {
    id: 102,
    title: "Mapping Exoplanets & Binary Star Systems: Insights from High-Altitude Observatories",
    slug: "mapping-exoplanets-binary-star-systems",
    excerpt: "In-depth transit photometries and spectral analysis uncovering potentially habitable exoplanets beyond our Solar System.",
    cover_image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop",
    category: { name: "Astrophysics", slug: "astrophysics" },
    categories: [{ name: "Astrophysics", slug: "astrophysics" }],
    tags: ["Exoplanets", "Stars"],
    read_time: 7,
    published_at: "2026-06-15T00:00:00Z",
    published_at_formatted: "Jun 2026",
    is_featured: false,
    is_exclusive: false,
    author: { name: "Dr. Biruk Tadesse", avatar: null, slug: "biruk-tadesse" },
    stats: { views: 890, likes: 64 }
  },
  {
    id: 103,
    title: "Next-Gen Satellite Doppler Tracking & Orbital Mechanics for Space Education",
    slug: "next-gen-satellite-doppler-tracking",
    excerpt: "Empowering students and researchers with real-time orbital trajectory modeling and satellite telemetry tools.",
    cover_image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop",
    category: { name: "Satellites", slug: "satellites" },
    categories: [{ name: "Satellites", slug: "satellites" }],
    tags: ["Satellites", "Orbital Mechanics"],
    read_time: 4,
    published_at: "2026-05-20T00:00:00Z",
    published_at_formatted: "May 2026",
    is_featured: false,
    is_exclusive: false,
    author: { name: "Space Engineering Div", avatar: null, slug: "space-engineering" },
    stats: { views: 1420, likes: 112 }
  },
  {
    id: 104,
    title: "Solar Syzygy & Eclipse Geometry: Understanding Obscuration Pathways",
    slug: "solar-syzygy-eclipse-geometry",
    excerpt: "A mathematical breakdown of solar and lunar eclipse predictions using ephemerides calculation models.",
    cover_image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=800&auto=format&fit=crop",
    category: { name: "Aerospace", slug: "aerospace" },
    categories: [{ name: "Aerospace", slug: "aerospace" }],
    tags: ["Eclipses", "Solar Physics"],
    read_time: 6,
    published_at: "2026-04-10T00:00:00Z",
    published_at_formatted: "Apr 2026",
    is_featured: false,
    is_exclusive: false,
    author: { name: "Astrophysics Lab", avatar: null, slug: "astrophysics-lab" },
    stats: { views: 760, likes: 45 }
  }
];

export default function BlogsPage() {
  const { theme, language } = usePortalStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);

  // Reset to first page on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, language]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const CACHE_KEY = `blogs_cache_${selectedCategory}_${searchQuery}_${language}`;

    const loadArticles = async () => {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 1000 * 60 * 5) {
            if (isMounted) {
              setArticles(data);
              setIsLiveApi(true);
              setLoading(false);
            }
            return;
          }
        }

        const response = await fetchScienceBlogs({
          category: selectedCategory,
          lang: language,
        });

        if (isMounted) {
          if (response.success && response.data && response.data.length > 0) {
            let finalData = response.data;
            
            // Auto-detect and filter by language (since API lacks language flag)
            finalData = finalData.filter((art) => {
              const isAm = /[\u1200-\u137F]/.test(art.title);
              return language === "am" ? isAm : !isAm;
            });
            
            if (searchQuery) {
              finalData = finalData.filter((art) => 
                art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (art.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            setArticles(finalData);
            setIsLiveApi(true);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: finalData, timestamp: Date.now() }));
          } else {
            const filtered = FALLBACK_ARTICLES.filter((art) => {
              const matchesCat =
                selectedCategory === "all" ||
                art.category?.slug.toLowerCase() === selectedCategory.toLowerCase();
              const matchesSearch =
                !searchQuery ||
                art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesCat && matchesSearch;
            });
            setArticles(filtered);
            setIsLiveApi(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setArticles(FALLBACK_ARTICLES);
          setIsLiveApi(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(loadArticles, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchQuery, language]);

  return (
    <div className="min-h-screen bg-black light:bg-white text-zinc-100 light:text-zinc-900 font-sans">
      <UniversalNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="flex justify-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full rounded-[2.5rem] bg-[#8063FF] text-white p-10 sm:p-16 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl overflow-hidden min-h-[400px]"
          >
            {/* Background 3D Sentient Mesh */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40 mix-blend-screen">
              <SentientMeshCanvas
                activeObject="low-poly-fabric"
                meshScale={1.5}
                meshPosition={[0, 0, 0]}
                cameraFov={45}
                autoRotate={false}
                interactive={false}
                bgColor="bg-transparent"
              />
            </div>

            {/* Subtle background grid pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <h1 className="relative z-10 text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight text-center">
              Space Science <br />
              <span className="font-normal text-indigo-100">Publications</span>
            </h1>

            <p className="relative z-10 text-base sm:text-lg text-indigo-50 max-w-3xl mx-auto leading-relaxed font-medium text-center">
              Discover research highlights, astronomy deep dives, aerospace engineering papers, and satellite mission logs powered by the Hewa+.
            </p>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-6">
              <a
                href="https://hewa.ethiosss.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-[#8063FF] font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all cursor-pointer shadow-lg hover:scale-105"
              >
                <span>Discover More</span>
                <ArrowRight size={15} />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.esss.hewaplus"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Download the Hewa+ App</span>
              </a>
            </div>
          </motion.div>
        </section>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat.slug
                    ? "bg-[#FFEA4B] text-black shadow-lg shadow-[#FFEA4B]/20"
                    : "bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:border-zinc-700 light:hover:border-zinc-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "latest" | "popular")}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 focus:outline-none focus:border-zinc-600 light:focus:border-zinc-400 cursor-pointer"
            >
              <option value="latest">Latest Published</option>
              <option value="popular">Most Viewed</option>
            </select>
            
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
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-[#FFEA4B] animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 space-y-3 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-300">No publications found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No matching science articles found for selected category or query.
            </p>
          </div>
        ) : (
          /* Articles Grid */
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...articles].sort((a, b) => {
                if (sortBy === "popular") {
                  const viewsA = a.stats?.views || 0;
                  const viewsB = b.stats?.views || 0;
                  return viewsB - viewsA;
                }
                const dateA = new Date(a.published_at || 0).getTime();
                const dateB = new Date(b.published_at || 0).getTime();
                return dateB - dateA;
              })
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((art) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <a
                    href={`https://hewa.ethiosss.org/blog/${art.slug}`}
                    className="flex flex-col min-h-[420px] p-6 rounded-3xl bg-zinc-900/80 light:bg-zinc-50 border border-transparent hover:border-zinc-800 light:hover:border-zinc-200 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl light:hover:shadow-xl group"
                  >
                    <div className="w-full h-[200px] rounded-2xl overflow-hidden bg-zinc-800 light:bg-zinc-200 mb-5 shrink-0 relative">
                       <img 
                         src={art.cover_image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"} 
                         alt={art.title} 
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                       />
                    </div>
                    <div className="flex items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFEA4B] text-black">
                        {art.category?.name || "Science"}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white light:text-zinc-900 group-hover:text-[#FFEA4B] light:group-hover:text-amber-500 transition-colors mb-4 line-clamp-3 leading-snug">
                      {art.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between text-sm font-medium text-zinc-500 light:text-zinc-500">
                       <div className="flex items-center gap-1.5">
                         <Clock className="w-4 h-4" />
                         <span>{art.read_time || 5} min</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <Calendar className="w-4 h-4" />
                         <span>{art.published_at_formatted}</span>
                       </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {articles.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 rounded-full border border-zinc-800 light:border-zinc-300 bg-zinc-900 light:bg-white text-white light:text-zinc-900 text-sm font-bold font-mono disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
                >
                  PREV
                </button>
                <span className="text-sm font-mono text-zinc-400 font-medium">
                  PAGE {currentPage} OF {Math.ceil(articles.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(articles.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(articles.length / itemsPerPage)}
                  className="px-6 py-2.5 rounded-full border border-zinc-800 light:border-zinc-300 bg-zinc-900 light:bg-white text-white light:text-zinc-900 text-sm font-bold font-mono disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
                >
                  NEXT
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <UniversalFooter />
    </div>
  );
}

