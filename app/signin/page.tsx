"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <main style={{ minHeight:"100vh", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
        <div className="fade-up" style={{ width:"100%", maxWidth:"360px" }}>

          {/* Brand */}
          <div style={{ textAlign:"center", marginBottom:"32px" }}>
            <div style={{ width:"64px", height:"64px", borderRadius:"18px", background:"#1a1a2e", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/>
                <line x1="10" y1="1" x2="10" y2="4"/>
                <line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </div>
            <h1 style={{ fontSize:"26px", fontWeight:700, color:"#1a1a2e", margin:"0 0 6px", letterSpacing:"-0.5px" }}>
              FitForge AI
            </h1>
            <p style={{ fontSize:"14px", color:"#9ca3af", margin:0 }}>Your personal AI fitness trainer</p>
          </div>

          {/* Sign in card */}
          <div style={{ background:"white", borderRadius:"24px", padding:"28px", border:"1px solid #f3f4f6", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize:"18px", fontWeight:600, color:"#1f2937", margin:"0 0 6px", textAlign:"center" }}>Welcome</h2>
            <p style={{ fontSize:"13px", color:"#9ca3af", margin:"0 0 24px", textAlign:"center", lineHeight:1.6 }}>
              Sign in to access your workouts, track your nutrition, and build your fitness plan.
            </p>

            {/* Google sign in button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", padding:"13px 20px", borderRadius:"14px", border:"1px solid #e5e7eb", background:"white", cursor:loading ? "not-allowed" : "pointer", transition:"all 0.2s", opacity:loading ? 0.7 : 1 }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; }}>
              {loading ? (
                <div style={{ width:"20px", height:"20px", borderRadius:"50%", border:"2px solid #e5e7eb", borderTopColor:"#4f46e5", animation:"spin 0.8s linear infinite" }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span style={{ fontSize:"14px", fontWeight:500, color:"#374151" }}>
                {loading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>

            <div style={{ margin:"20px 0", display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ flex:1, height:"1px", background:"#f3f4f6" }} />
              <span style={{ fontSize:"11px", color:"#d1d5db" }}>secure sign in</span>
              <div style={{ flex:1, height:"1px", background:"#f3f4f6" }} />
            </div>

            {/* Feature highlights */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {[
                { icon:"⚡", text:"AI-generated weekly workout plans" },
                { icon:"📅", text:"Monthly progress calendar" },
                { icon:"🥗", text:"Nutrition tracking with AI calculator" },
              ].map(f => (
                <div key={f.text} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontSize:"14px" }}>{f.icon}</span>
                  <span style={{ fontSize:"12px", color:"#6b7280" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign:"center", fontSize:"11px", color:"#d1d5db", marginTop:"20px" }}>
            By signing in you agree to our terms of service
          </p>
        </div>
      </main>
    </>
  );
}