'use client';

import { useEffect, useState, useCallback } from 'react';
import { Agent } from '@/lib/types';
import { AgentCard } from '@/components/agent/agent-card';
import { Search, Users, Award, TrendingUp, Star, Shield, MapPin, Zap } from 'lucide-react';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [heroIn, setHeroIn] = useState(false);

  useEffect(() => { setTimeout(() => setHeroIn(true), 80); }, []);

  const fetchAgents = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await fetch(`/api/agents?${params}`);
      const data = await response.json();
      setAgents(Array.isArray(data) ? data : (data.data ?? data.agents ?? []));
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents(search);
  }, [search, fetchAgents]);

  /* trust badges */
  const trustBadges = [
    { icon: <Shield className="w-3 h-3" />, text: 'PRC Licensed' },
    { icon: <Star className="w-3 h-3" />, text: '4.9★ Rated' },
    { icon: <Award className="w-3 h-3" />, text: 'Top Performers' },
  ];

  /* quick-info strip */
  const quickInfo = [
    { icon: <Users className="w-3.5 h-3.5" />, text: '50+ Licensed Agents' },
    { icon: <MapPin className="w-3.5 h-3.5" />, text: '20+ Cities' },
    { icon: <Zap className="w-3.5 h-3.5" />, text: 'Always Available' },
  ];

  return (
    <div className="w-full min-h-screen" style={{ background: 'linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)' }}>
      <style>{`
        @keyframes float-p0{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes float-p1{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes float-p2{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}
        @keyframes shimmer{0%{left:-100%}100%{left:200%}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      {/* ══════════════════════════════
           HERO — editorial talent-roster
         ══════════════════════════════ */}
      <section className="relative bg-gradient-to-bl from-red-800/80 from-[10%] via-[#3d0012]/90 via-[70%] to-red-800/60 to-[100%] pt-32 pb-0 overflow-hidden">

        {/* dot grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.5) 1px,transparent 0)', backgroundSize: '30px 30px' }} />
        {/* glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-25"
          style={{ background: 'radial-gradient(circle,#e74c3c 0%,transparent 65%)' }} />
        {/* shimmer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)', animation: 'shimmer 5s ease-in-out infinite' }} />
        </div>
        {/* floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: `${3 + (i % 4) * 2}px`, height: `${3 + (i % 4) * 2}px`,
              left: `${(i * 10.3) % 100}%`, top: `${(i * 13.7) % 100}%`,
              background: i % 2 === 0 ? 'rgba(231,76,60,0.4)' : 'rgba(255,255,255,0.15)',
              animation: `float-p${i % 3} ${4 + (i % 3) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pb-20">

            {/* LEFT */}
            <div>
              {/* eyebrow */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(35px)', transition: 'opacity .8s ease 0ms,transform .8s ease 0ms' }}>
                <div className="inline-flex items-center gap-2 mb-5">
                  <div className="h-px w-10" style={{ background: 'linear-gradient(90deg,#e8a8a0,#d4a5a0)' }} />
                  <span className="text-red-200 text-xs font-black tracking-[0.2em] uppercase">Meet the Team</span>
                </div>
              </div>

              {/* headline */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(35px)', transition: 'opacity .8s ease 150ms,transform .8s ease 150ms' }}>
                <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-5 drop-shadow-xl">
                  Our Top<br />
                  <span className="text-red-300">Agents</span>{' '}
                  <span className="text-white/40">&amp; Team</span>
                </h1>
              </div>

              {/* paragraph */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(35px)', transition: 'opacity .8s ease 250ms,transform .8s ease 250ms' }}>
                <p className="text-white/75 text-lg leading-relaxed max-w-lg mb-5">
                  Connect with experienced, PRC-licensed real estate professionals who know the Philippine market inside out — and genuinely care about finding you the right property.
                </p>
              </div>

              {/* trust badges */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(35px)', transition: 'opacity .8s ease 330ms,transform .8s ease 330ms' }}>
                <div className="flex flex-wrap gap-2 mb-5">
                  {trustBadges.map(({ icon, text }) => (
                    <span key={text}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/20 hover:border-white/40 transition-all cursor-default"
                      style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                      <span className="text-red-300">{icon}</span>{text}
                    </span>
                  ))}
                </div>
              </div>

              {/* quick-info */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(35px)', transition: 'opacity .8s ease 410ms,transform .8s ease 410ms' }}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-7">
                  {quickInfo.map(({ icon, text }, i) => (
                    <span key={text} className="inline-flex items-center gap-1.5 text-white/50 text-sm">
                      <span className="text-red-300/80">{icon}</span>{text}
                      {i < quickInfo.length - 1 && <span className="ml-4 text-white/20 hidden sm:inline">·</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* search bar — lives in hero */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'none' : 'translateY(35px)', transition: 'opacity .8s ease 490ms,transform .8s ease 490ms' }}>
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or specialization…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl focus:outline-none transition-all text-gray-900 placeholder-gray-400 shadow-2xl text-sm font-medium focus:ring-2 focus:ring-red-400"
                    style={{ background: 'rgba(255,255,255,0.97)' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors text-xs font-bold">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — premium features showcase */}
            <div className="space-y-4">
              {[
                { title: 'Expert Negotiators', desc: 'Masterful deal-making to get you the best value', icon: <Award className="w-5 h-5" />, d: 200 },
                { title: 'Market Intelligence', desc: 'Latest trends and pricing data at your fingertips', icon: <TrendingUp className="w-5 h-5" />, d: 350 },
                { title: 'Trusted Network', desc: '50+ licensed professionals across 20+ cities', icon: <Users className="w-5 h-5" />, d: 500 },
                { title: 'Award Winning', desc: '4.9★ rated by thousands of satisfied clients', icon: <Star className="w-5 h-5" />, d: 650 },
              ].map(({ title, desc, icon, d }) => (
                <div key={title}
                  className="rounded-xl p-4 border border-white/15 hover:border-white/30 transition-all duration-300 group"
                  style={{
                    background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(12px)',
                    opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(30px)',
                    transition: `opacity .8s ease ${d}ms,transform .8s ease ${d}ms`,
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-300 mt-0.5"
                      style={{ background: 'rgba(231,76,60,0.55)', border: '1px solid rgba(231,76,60,0.4)' }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white leading-tight">{title}</h3>
                      <p className="text-xs text-red-100/50 font-medium mt-1 leading-snug">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── scrolling ticker bar — unique editorial touch ── */}
        <div className="relative z-10 border-t border-white/10 overflow-hidden"
          style={{ background: 'rgba(30,15,15,0.6)', backdropFilter: 'blur(8px)' }}>

          <div className="flex" style={{ animation: 'ticker 28s linear infinite', width: 'max-content' }}>
            {[...Array(2)].map((_, rep) => (
              <div key={rep} className="flex items-center gap-0 py-3">

                {[
                  'Licensed Real Estate Agents',
                  'Certified Property Specialists',
                  'Expert Negotiators',
                  'Client-Focused Service',
                  'Trusted Property Advisors',
                  'Residential Sales Experts',
                  'Commercial Property Agents',
                  'Investment Property Specialists',
                  'Market Analysis Experts',
                  'Property Valuation Services',
                  'End-to-End Assistance',
                  'Fast & Secure Transactions',
                  'Home Buying Experts',
                  'Property Selling Pros'
                ].map((item, i) => (

                  <span key={`${rep}-${i}`} className="inline-flex items-center gap-3 px-6 text-xs font-black text-white tracking-[0.15em] uppercase whitespace-nowrap">
                    <span className="w-1 h-1 rounded-full bg-red-400/60 flex-shrink-0" />
                    {item}
                  </span>

                ))}
              </div>
            ))}
          </div>
        </div>

        {/* wave — now blends into #E8EAED instead of white */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12" fill="#4d506a">
            <path d="M0,48 C480,0 960,48 1440,16 L1440,48 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════
           AGENTS GRID
         ══════════════════════════════ */}
      <section className="py-25 bg-gradient-to-t from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* section header */}
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-red-500" />
                <span className="text-red-500 text-xs font-black tracking-[0.2em] uppercase">Our Roster</span>
              </div>
              <h2 className="text-3xl font-black text-white">
                {loading ? 'Loading Agents…' : (
                  <>
                    <span className="text-red-400">{agents.length}</span>{' '}
                    {agents.length === 1 ? 'Agent' : 'Agents'}
                    {search && <span className="text-white/40 font-medium text-xl ml-2">for "{search}"</span>}
                  </>
                )}
              </h2>
            </div>
            {search && !loading && (
              <button onClick={() => setSearch('')}
                className="inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-4 py-2 rounded-full transition-all hover:bg-red-900/30">
                ✕ Clear search
              </button>
            )}
          </div>

          {/* grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-sm animate-pulse" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="h-56" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-2/3 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="h-3 w-1/2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="h-3 w-3/4 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {agents.map((agent, index) => (
                <div key={agent.id} className="relative group">
                  {/* ranking badge */}
                  <div className="absolute -top-3 -left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg,#c0392b,#e74c3c)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  {/* hover accent */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                    style={{ background: 'linear-gradient(135deg,rgba(192,57,43,0.04) 0%,transparent 60%)', outline: '2px solid rgba(192,57,43,0.15)', borderRadius: '1rem' }} />
                  <AgentCard
                    agent={agent}
                    onReviewed={() => fetchAgents(search)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.3)' }}>
                <Users className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-2xl font-black text-white mb-2">No agents found</p>
              <p className="text-white/40 text-base mb-6 max-w-sm mx-auto">
                Try a different name or specialization, or browse our full roster.
              </p>
              {search && (
                <button onClick={() => setSearch('')}
                  className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 hover:shadow-lg text-sm"
                  style={{ background: 'linear-gradient(135deg,#c0392b,#96281b)', boxShadow: '0 6px 20px rgba(192,57,43,0.3)' }}>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
