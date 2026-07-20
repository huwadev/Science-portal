"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import SentientMeshWrapper from "@/components/sentient/SentientMeshWrapper";
import { KeyRound, ShieldAlert, CheckCircle, RefreshCw, Clipboard } from "lucide-react";

export default function AdminTokenCallbackPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [isVerifyRequired, setIsVerifyRequired] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // TOTP code state
  const [code, setCode] = useState("");
  const [submittingCode, setSubmittingCode] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    const exchangeToken = async () => {
      const hash = window.location.hash;
      if (!hash.includes("access_token=")) {
        setError("Missing authentication parameters. Please sign in again.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");

      if (!accessToken) {
        setError("Invalid access token format.");
        setLoading(false);
        return;
      }

      // Clean browser history URL
      window.history.replaceState(null, "", window.location.pathname);

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to exchange Google credential.");
        }

        if (data.two_factor_required) {
          setTempToken(data.temp_token);
          setEmail(data.email || "");
          setIsVerifyRequired(true);
        } else if (data.two_factor_setup_required) {
          setTempToken(data.temp_token);
          setTotpSecret(data.secret);
          setQrCodeUrl(data.qr_code_url);
          setEmail(data.email || "");
          setIsSetupRequired(true);
        } else {
          throw new Error("Invalid login payload from administrative portal.");
        }
      } catch (err: any) {
        console.error("Token verification failed", err);
        setError(err.message || "Failed to authenticate. Contact system administrators.");
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, []);

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setSubmittingCode(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp_token: tempToken,
          code: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification code incorrect. Please try again.");
      }

      // Store administration state
      localStorage.setItem("admin_api_token", data.token);
      localStorage.setItem("admin_email", data.user.email);
      localStorage.setItem("admin_role", data.user.role);
      localStorage.setItem("admin_permissions", JSON.stringify(data.user.permissions || []));
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      router.push("/admin");
    } catch (err: any) {
      console.error("2FA code validation error", err);
      setError(err.message || "Authenticator verification failed.");
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleCopySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verifying Administrator Claims...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background">
      <SentientMeshWrapper activeObject="torus" themeColor="#6366f1" intensity={0.2} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff04_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff04_1px,transparent_1px)] bg-[size:3rem_3rem] -z-20"></div>

      <div className="glass rounded-[2rem] border border-card-border max-w-md w-full p-8 relative overflow-hidden shadow-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Multi-Factor Authentication</h2>
          <p className="text-[11px] text-gray-400">
            Verify possession of your configured authenticator code for: <span className="font-mono text-white">{email}</span>
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex gap-2 items-start">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {isSetupRequired && qrCodeUrl && (
          <div className="p-5 border border-card-border/50 rounded-2xl bg-card/20 space-y-4 text-center">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest block">Step 1: Setup Authenticator</span>
            <div className="bg-white p-3 rounded-2xl inline-block border border-card-border">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Authenticator Setup QR"
                className="w-36 h-36 mx-auto"
              />
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs mx-auto">
              Scan the QR code with Google Authenticator or manual setup:
            </p>
            <div className="flex items-center justify-between border border-card-border/30 rounded-xl px-3 py-2 bg-black/40">
              <span className="font-mono text-xs text-white select-all">{totpSecret}</span>
              <button
                type="button"
                onClick={handleCopySecret}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedSecret ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleVerify2fa} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isSetupRequired ? "Step 2: Enter Verification Code" : "Authenticator Code"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full text-center py-3 bg-black/40 border border-card-border/30 rounded-xl text-white font-mono text-xl tracking-[0.4em] focus:outline-none focus:border-primary transition-colors"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={submittingCode || code.length !== 6}
            className="w-full py-3.5 rounded-xl bg-primary text-background font-bold text-xs uppercase hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingCode ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify and Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
