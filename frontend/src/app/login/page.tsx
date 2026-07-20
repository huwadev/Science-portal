"use client";

import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortalStore } from "@/store/usePortalStore";
import { translations } from "@/lib/translations";
import SentientMeshWrapper from "@/components/sentient/SentientMeshWrapper";
import { ShieldAlert, Compass, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { language, setToken, setUser, user } = usePortalStore();
  const t = translations[language];

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user already logged in, redirect them immediately
    if (user) {
      router.push(redirect);
    }
  }, [user, redirect, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("No credential returned from Google.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Authentication failed on server.");
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      router.push(redirect);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "An error occurred during Google authentication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background decoration */}
      <SentientMeshWrapper activeObject="sphere" themeColor="#00d2ff" intensity={0.2} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff04_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff04_1px,transparent_1px)] bg-[size:3rem_3rem] -z-20"></div>

      <div className="glass rounded-[2rem] border border-card-border/75 max-w-md w-full p-8 sm:p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>

        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>

        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-center text-primary animate-pulse">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">ESSS Portal Access</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Log in to verify your membership credentials and run advanced orbital simulations.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Sign In Button Wrapper */}
        <div className="flex flex-col items-center justify-center py-4 bg-card/20 border border-card-border/30 rounded-2xl relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verifying Session...</span>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google Login failed. Please try again.");
              }}
              useOneTap
              theme="filled_dark"
              shape="pill"
            />
          )}
        </div>

        {/* Help footer */}
        <div className="text-[10px] text-center text-gray-500 leading-relaxed max-w-xs mx-auto">
          By signing in, you verify that you are associated with the Ethiopian Space Science Society (ESSS). For admin roles, you must sign in with a pre-registered `@ethiosss.org` domain.
        </div>
      </div>
    </div>
  );
}
