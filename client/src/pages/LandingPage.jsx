import React, { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, 
  ScanSearch, 
  Terminal, 
  Cpu, 
  FileText, 
  Workflow, 
  LockKeyhole 
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const dataFragments = [
  {
    id: 1, text: ["John Doe", "john.doe@company.com", "+1 (202) 555-0147"],
    redacted: ["[USER_01]", "[EMAIL_REDACTED]", "[PHONE_HIDDEN]"],
    x: -385, y: -175, rot: -4,
  },
  {
    id: 2, text: ["jane@email.com", "Tier 2 Support", "Dept: Engineering"],
    redacted: ["[EMAIL_REDACTED]", "Tier 2 Support", "Dept: Engineering"],
    x: -305, y: 145, rot: 3,
  },
  {
    id: 3, text: ["SSN: 821-41-9912", "Medical Record", "DOB: 1988-04-22"],
    redacted: ["[SSN_HIDDEN]", "Medical Record", "[PHI_REDACTED]"],
    x: -428, y: 32, rot: -2,
  },
  {
    id: 4, text: ["Account Number", "84992011034", "Routing: 021000021"],
    redacted: ["[ACCOUNT_HIDDEN]", "[DATA_SECURED]", "[ROUTING_HIDDEN]"],
    x: 375, y: 145, rot: 5,
  },
  {
    id: 5, text: ["Project Athena", "Internal Roadmap", "Clearance: Level 3"],
    redacted: ["[PROJECT_REDACTED]", "Internal Roadmap", "[CLEARANCE_HIDDEN]"],
    x: 305, y: -168, rot: -3,
  },
  {
    id: 6, text: ["Patient ID: 992", "MRN: 849922110504", "Dr. Sarah Mitchell"],
    redacted: ["[PATIENT_HIDDEN]", "[PHI_REDACTED]", "[PROVIDER_REDACTED]"],
    x: 408, y: -12, rot: 4,
  },
];

const papers = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  left: `${10 + Math.sin(i * 1.7) * 40 + 40}%`,
  top: `${10 + Math.cos(i * 1.3) * 35 + 40}%`,
  rot: (i * 37 % 60) - 30,
  w: 44 + (i * 13 % 40), h: 60 + (i * 17 % 32),
  op: 0.08 + (i % 5) * 0.05,
}));

const revealWords = ['Privacy', 'Creates', 'Trust.'];

const orbTags = [
  { text: 'respect',  left: '2%',  top: '30%' },
  { text: 'security', left: '20%', top: '-18%' },
  { text: 'safe',     left: '42%', top: '65%' },
  { text: 'trust',    left: '63%', top: '-12%' },
  { text: 'protect',  left: '81%', top: '32%' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const wrapRef  = useRef(null);
  const sunRef   = useRef(null);
  const darkRef  = useRef(null);
  const robotRef = useRef(null);
  const headRef  = useRef(null);
  const eyeL     = useRef(null);
  const eyeR     = useRef(null);
  const beamRef  = useRef(null);
  const hudRef   = useRef(null);
  const rawRefs  = useRef([]);
  const redRefs  = useRef([]);
  const wordRefs = useRef([]);
  const tagRefs  = useRef([]);
  const orbitRef = useRef(null);
  const finalRef = useRef(null);
  const ctaRef   = useRef(null);

  useLayoutEffect(() => {
    // Force hardware acceleration globally for GSAP in this component
    gsap.config({ force3D: true });

    // Idle eye pulse
    gsap.to([eyeL.current, eyeR.current], {
      opacity: 0.4, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.6,
    });

    // Idle card float - optimized to avoid matrix recalculations during scroll
    rawRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        y: `+=${8}`, x: `+=${3}`, rotation: `+=${1}`,
        duration: 4.5 + i * 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.3,
      });
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=8000',
          scrub: 1.2, // Tighter scrub for frictionless responsiveness
          pin: true,
          anticipatePin: 1,
        },
      });

      // Initial state
      tl.set(robotRef.current,  { opacity: 0, y: 150, scale: 0.85 })
        .set(beamRef.current,   { opacity: 0, scaleX: 0 })
        .set(hudRef.current,    { opacity: 0, x: 50 })
        .set(redRefs.current,   { opacity: 0, scale: 0.95, y: 20 })
        .set(wordRefs.current,  { opacity: 0, y: 30, scale: 0.9 })
        .set(tagRefs.current,   { opacity: 0, scale: 0.8 })
        .set(orbitRef.current,  { opacity: 0 })
        .set(finalRef.current,  { opacity: 0, y: 40 })
        .set(ctaRef.current,    { opacity: 0, y: 20 });

      // SCENE 2: ARRIVAL
      tl.to(robotRef.current, { opacity: 1, y: 0, scale: 1, duration: 2, ease: 'power2.out' }, 'arrival')
        .to(headRef.current,  { rotation: 12, duration: 1, ease: 'power2.out' }, 'arrival+=1')
        .to(headRef.current,  { rotation: -5, duration: 1.5, ease: 'sine.inOut' }, 'arrival+=2')
        .to(headRef.current,  { rotation: 0,  duration: 1, ease: 'sine.inOut' }, 'arrival+=3.5');

      // SCENE 3: UNDERSTANDING
      tl.to(sunRef.current,  { opacity: 0, duration: 2, ease: 'none' }, 'scan')
        .to(darkRef.current, { opacity: 0.9, duration: 2, ease: 'none' }, 'scan')
        .to(robotRef.current, { x: -80, duration: 2, ease: 'power2.inOut' }, 'scan')
        .to(beamRef.current,  { opacity: 1, scaleX: 1, duration: 2, ease: 'power2.out' }, 'scan+=0.5')
        .to(hudRef.current,   { opacity: 1, x: 0, duration: 1.5, ease: 'back.out(1.2)' }, 'scan+=0.7')
        .to(rawRefs.current, {
            backgroundColor: '#082f49', // Solid color transition instead of heavy shadows
            color: '#a5f3fc',
            borderColor: '#06b6d4',
            stagger: 0.1, duration: 1.5, ease: 'power1.inOut'
          }, 'scan+=1');

      // SCENE 4: SANITIZATION (Replaced expensive blurs with simple scale/opacity)
      tl.to(sunRef.current,  { opacity: 1, duration: 2, ease: 'none' }, 'clean')
        .to(darkRef.current, { opacity: 0, duration: 2, ease: 'none' }, 'clean')
        .to(robotRef.current, { x: 0, duration: 1.5, ease: 'power2.inOut' }, 'clean')
        .to(hudRef.current,   { opacity: 0, x: 50, duration: 1.2, ease: 'power2.in' }, 'clean')
        .to(beamRef.current,  { opacity: 0.15, scaleX: 0.7, duration: 1.5, ease: 'none' }, 'clean')
        .to(rawRefs.current, {
            opacity: 0, scale: 0.95, y: '-=20',
            stagger: 0.1, duration: 1.5, ease: 'power2.in',
          }, 'clean+=0.5')
        .to(redRefs.current, {
            opacity: 1, scale: 1, y: 0,
            stagger: 0.1, duration: 1.5, ease: 'power2.out',
          }, 'clean+=1')
        .to(beamRef.current, { opacity: 0, duration: 1, ease: 'none' }, 'clean+=2.5');

      // SCENE 5: REVELATION
      tl.to(redRefs.current, {
            opacity: 0, y: '-=30', scale: 1.05,
            stagger: 0.1, duration: 2, ease: 'power2.inOut',
          }, 'reveal')
        .to(darkRef.current, { opacity: 0.75, duration: 2, ease: 'none' }, 'reveal')
        .to(sunRef.current,  { opacity: 0.1, duration: 2, ease: 'none' }, 'reveal')
        .to(wordRefs.current, {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.15, duration: 2, ease: 'back.out(1.2)',
          }, 'reveal+=1.5')
        .to(tagRefs.current, {
            opacity: 1, scale: 1,
            stagger: 0.1, duration: 1.5, ease: 'power2.out',
          }, 'reveal+=2.5')
        .to(orbitRef.current, { opacity: 1, duration: 2, ease: 'none' }, 'reveal+=2');

      // SCENE 6: COMPLETION
      tl.to(wordRefs.current, { opacity: 0, y: -20, stagger: 0.05, duration: 1, ease: 'power2.in' }, 'complete')
        .to(tagRefs.current,  { opacity: 0, scale: 0.9, stagger: 0.05, duration: 1, ease: 'none' }, 'complete')
        .to(orbitRef.current, { opacity: 0, duration: 1, ease: 'none' }, 'complete')
        .to(darkRef.current,  { opacity: 0, duration: 2, ease: 'none' }, 'complete')
        .to(sunRef.current,   { opacity: 1, duration: 2, ease: 'none' }, 'complete')
        .to(robotRef.current, { x: '-38vw', y: 88, scale: 0.9, duration: 2.5, ease: 'power3.inOut' }, 'complete+=0.5')
        .to(headRef.current,  { rotation: 13, duration: 1.5, ease: 'power2.inOut' }, 'complete+=1.5')
        .to(finalRef.current, { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 'complete+=1.5')
        .to(ctaRef.current,   { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 'complete+=2');

    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div style={{
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      background: '#0B1120', color: '#F8FAFC', overflowX: 'hidden', minHeight: '100vh', userSelect: 'none',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::selection { background: #06B6D4; color: #020617; }
        html { scroll-behavior: smooth; }
        
        /* HARDWARE ACCELERATION & OPTIMIZATION */
        .card-raw, .card-red, .tag-pill, .hud-panel, .robot-layer {
          will-change: transform, opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          perspective: 1000;
          transform-style: preserve-3d;
        }

        .card-raw {
          position: absolute; width: 224px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 16px;
          padding: 17px 19px; font-size: 13px; line-height: 1.62; color: #F8FAFC; font-weight: 500;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .card-red {
          position: absolute; width: 224px;
          background: rgba(8, 47, 73, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 16px;
          padding: 17px 19px; font-size: 13px; line-height: 1.62; font-weight: 500;
          box-shadow: 0 8px 32px rgba(6, 182, 212, 0.15);
          color: #CFFAFE;
        }
        .tag-pill {
          position: absolute;
          background: rgba(8,47,73,0.8); border: 1px solid rgba(6,182,212,0.42);
          color: #a5f3fc; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.1em; 
          padding: 7px 18px; border-radius: 100px; white-space: nowrap;
        }
        .hud-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid rgba(6,182,212,0.12);
        }
        
        /* Buttons */
        .btn-cta-dark {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 16px 40px; background: #06B6D4; color: #082F49;
          border: none; border-radius: 100px; font-size: 15px; font-weight: 700; letter-spacing: -0.2px;
          cursor: pointer; transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit;
          box-shadow: 0 0 20px rgba(6,182,212,0.4);
        }
        .btn-cta-dark:hover { background: #22D3EE; transform: translateY(-2px); box-shadow: 0 0 30px rgba(6,182,212,0.6); }
        .btn-cta-light {
          display: inline-flex; align-items: center;
          padding: 16px 40px; background: transparent; color: #F8FAFC;
          border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 100px;
          font-size: 15px; font-weight: 600; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
          font-family: inherit;
        }
        .btn-cta-light:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); border-color: #F8FAFC; }
        .btn-console-hdr {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 22px; background: rgba(255,255,255,0.1); color: #F8FAFC;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.2s ease; font-family: inherit;
        }
        .btn-console-hdr:hover { background: rgba(255,255,255,0.15); }
        
        /* Bento Grid Styles */
        .bento-grid {
          display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; margin-top: 60px;
        }
        .bento-card {
          background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 24px;
          padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; display: flex; flex-direction: column;
          color: #F8FAFC;
        }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-color: rgba(6,182,212,0.3); }
        .bento-icon-wrapper {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
        }
      `}</style>

      {/* ── FIXED HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100,
        padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(11, 17, 32, 0.8)', borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'rgba(6,182,212,0.15)',
            border: '1.5px solid rgba(6,182,212,0.5)', display: 'flex', alignItems: 'center', justifyItems: 'center',
            boxShadow: '0 0 10px rgba(6,182,212,0.3)',
          }}>
            <Shield size={14} color="#22D3EE" strokeWidth={2} style={{marginLeft: 'auto', marginRight: 'auto'}}/>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', color: '#F8FAFC' }}>CleanRoom</span>
        </div>
        <button className="btn-console-hdr" onClick={() => navigate('/console')}>
          <Terminal size={13} strokeWidth={2} /> Launch Console
        </button>
      </header>

      {/* ── MAIN PINNED SCENE ────────────────────────────────────────── */}
      <div ref={wrapRef} style={{
        height: '100vh', width: '100%', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>

        {/* ── ENVIRONMENT ──────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Deep Space / Slate Background */}
          <div style={{ position: 'absolute', inset: 0, background: '#0B1120' }} />
          
          {/* Radial Gradient Glows */}
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw',
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)',
          }} />

          {/* Subtle Tech Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(148, 163, 184, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
          }} />
        </div>

        {/* ── GLOW OVERLAY ─────────────────────────────────────────── */}
        <div ref={sunRef} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '0%', right: '10%', width: '40vw', height: '100vh',
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, transparent 70%)',
            mixBlendMode: 'screen',
          }} />
        </div>

        {/* ── DARKNESS OVERLAY ─────────────────────────────────────────── */}
        <div ref={darkRef} style={{ position: 'absolute', inset: 0, background: '#050810', zIndex: 6, opacity: 0, pointerEvents: 'none', mixBlendMode: 'multiply' }} />

        {/* ── DATA CARDS ───────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', opacity: 0.22, pointerEvents: 'none' }}>
            {[0,2,4].map(i => (
              <line key={i} x1="50%" y1="50%" x2={`calc(50% + ${dataFragments[i].x}px)`} y2={`calc(50% + ${dataFragments[i].y}px)`} stroke="#A8A29E" strokeWidth="0.8" strokeDasharray="4 7" />
            ))}
          </svg>

          {dataFragments.map((frag, i) => (
            <div key={frag.id} style={{ position: 'absolute' }}>
              <div ref={el => rawRefs.current[i] = el} className="card-raw" style={{ transform: `translate(${frag.x}px, ${frag.y}px) rotate(${frag.rot}deg)` }}>
                {frag.text.map((line, j) => <span key={j} style={{ display: 'block', color: j === 0 ? '#F8FAFC' : '#94A3B8' }}>{line}</span>)}
              </div>
              <div ref={el => redRefs.current[i] = el} className="card-red" style={{ transform: `translate(${frag.x}px, ${frag.y}px) rotate(${frag.rot}deg)` }}>
                {frag.redacted.map((line, j) => {
                  const isTag = line.startsWith('[');
                  return (
                    <span key={j} style={{
                      display: 'block', color: isTag ? '#0891b2' : '#164e63', fontFamily: isTag ? "'DM Mono', monospace" : 'inherit',
                      fontSize: isTag ? 11 : 13, letterSpacing: isTag ? '0.06em' : 'normal', fontWeight: isTag ? 600 : 500, marginTop: isTag ? 3 : 0,
                    }}>
                      {line}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── HUD PANEL ────────────────────────────────────────────────── */}
        <div ref={hudRef} className="hud-panel" style={{
          position: 'absolute', right: 36, top: '50%', transform: 'translate(70px, -50%)', width: 255,
          background: 'rgba(6,15,38,0.98)', border: '1px solid rgba(6,182,212,0.3)', borderLeft: '3px solid #06b6d4', borderRadius: '0 16px 16px 0',
          padding: '22px 20px', zIndex: 48,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <ScanSearch size={17} color="#22d3ee" strokeWidth={1.5} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#67e8f9' }}>Detection Engine</span>
          </div>
          {[['Names', '4 Found'], ['Emails', '2 Found'], ['Financial IDs', '3 Found'], ['Medical Records', '2 Found'], ['Phone Numbers', '1 Found']].map(([label, val]) => (
            <div key={label} className="hud-row">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(186,230,253,0.72)' }}>{label}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#22d3ee', letterSpacing: '0.04em' }}>● {val}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '10px 13px', background: 'rgba(6,182,212,0.09)', borderRadius: 9, border: '1px solid rgba(6,182,212,0.22)' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#67e8f9', letterSpacing: '0.12em' }}>CONFIDENCE 97.4%</span>
          </div>
        </div>

        {/* ── ROBOT ────────────────────────────────────────────────────── */}
        <div ref={robotRef} className="robot-layer" style={{ position: 'absolute', zIndex: 42, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div ref={beamRef} style={{
            position: 'absolute', top: 64, left: -490, width: 1060, height: 390, pointerEvents: 'none', transformOrigin: 'right center',
            mixBlendMode: 'screen', clipPath: 'polygon(0% 11%, 100% 46%, 100% 54%, 0% 89%)',
            background: 'linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.1) 35%, rgba(6,182,212,0.42) 82%, rgba(6,182,212,0.72) 100%)',
          }} />

          <svg width="210" height="252" viewBox="0 0 210 252" fill="none">
            {/* Treads/Base */}
            <rect x="28" y="200" width="154" height="36" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
            <rect x="22" y="204" width="46" height="28" rx="10" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />
            <rect x="142" y="204" width="46" height="28" rx="10" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />
            {[0,1,2,3,4].map(j => <rect key={j} x={36 + j * 28} y={207} width={13} height={22} rx={3} fill="#22d3ee" opacity="0.3" />)}
            
            {/* Body */}
            <rect x="46" y="116" width="118" height="90" rx="28" fill="#1E293B" stroke="#334155" strokeWidth="2" />
            <path d="M 68 152 L 142 152" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            <path d="M 68 170 L 142 170" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            
            <circle cx="105" cy="132" r="5" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.55)" strokeWidth="1" />
            <circle cx="105" cy="132" r="2.2" fill="#06b6d4" />
            
            {/* Arms */}
            <rect x="20" y="134" width="28" height="52" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            <rect x="162" y="134" width="28" height="52" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            <path d="M 90 96 L 90 118" stroke="#475569" strokeWidth="15" strokeLinecap="round" />
            <path d="M 120 96 L 120 118" stroke="#475569" strokeWidth="15" strokeLinecap="round" />
            
            {/* Head */}
            <g ref={headRef} style={{ transformOrigin: '105px 68px' }}>
              <rect x="30" y="22" width="150" height="84" rx="38" fill="#1E293B" stroke="#334155" strokeWidth="2" />
              <rect x="42" y="34" width="126" height="60" rx="26" fill="#020617" />
              {/* Eyes */}
              <circle cx="78" cy="64" r="14" fill="#082f49" />
              <circle ref={eyeL} cx="78" cy="64" r="11" fill="#06b6d4" />
              <circle cx="78" cy="64" r="5.5" fill="#cffafe" />
              <circle cx="81" cy="61" r="2.2" fill="white" opacity="0.92" />
              
              <circle cx="132" cy="64" r="14" fill="#082f49" />
              <circle ref={eyeR} cx="132" cy="64" r="11" fill="#06b6d4" />
              <circle cx="132" cy="64" r="5.5" fill="#cffafe" />
              <circle cx="135" cy="61" r="2.2" fill="white" opacity="0.92" />
              
              {/* Antenna */}
              <line x1="105" y1="22" x2="105" y2="7" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="105" cy="4" r="4.8" fill="#10b981" />
            </g>
          </svg>
        </div>

        {/* ── SCENE 5: REVELATION WORDS ───────────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 28, pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
            {revealWords.map((word, i) => (
              <div key={word} ref={el => wordRefs.current[i] = el} style={{
                fontSize: 'clamp(50px, 7vw, 90px)', fontWeight: 800, letterSpacing: '-2px', color: '#F0F9FF', lineHeight: 1,
                transform: 'translateY(44px)',
              }}>
                {word}
              </div>
            ))}
          </div>

          <div ref={orbitRef} style={{ position: 'relative', width: 480, height: 80 }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <ellipse cx="240" cy="40" rx="224" ry="26" fill="none" stroke="rgba(6,182,212,0.22)" strokeWidth="1" strokeDasharray="6 9" />
            </svg>
            {orbTags.map((tag, i) => <div key={tag.text} ref={el => tagRefs.current[i] = el} className="tag-pill" style={{ left: tag.left, top: tag.top }}>{tag.text}</div>)}
          </div>
        </div>

        {/* ── SCENE 6: COMPLETION ─────────────────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 62, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div ref={finalRef} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transform: 'translateY(64px)', opacity: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '2px solid rgba(6,182,212,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={21} color="#0891b2" strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#F8FAFC' }}>CleanRoom</span>
            </div>

            <h1 style={{ fontSize: 'clamp(50px, 7.5vw, 98px)', fontWeight: 800, letterSpacing: '-3.5px', color: '#F8FAFC', lineHeight: 0.98, textAlign: 'center', margin: 0 }}>
              Privacy Creates Trust.
            </h1>

            <p style={{ fontSize: 14, color: '#94A3B8', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>
              Protecting context without exposing identity.
            </p>
          </div>

          <div ref={ctaRef} style={{ display: 'flex', gap: 14, marginTop: 46, pointerEvents: 'auto', transform: 'translateY(32px)', opacity: 0 }}>
            <button className="btn-cta-dark" onClick={() => navigate('/console')}>
              <Terminal size={16} strokeWidth={2} /> Enter Console
            </button>
            <button className="btn-cta-light" onClick={() => document.getElementById('product-info')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>

      </div>

      {/* ── BELOW FOLD / PRODUCT INFO ──────────────────────────────────── */}
      <div id="product-info" style={{ 
        background: '#0B1120', 
        borderTop: '1px solid rgba(148, 163, 184, 0.1)', 
        padding: '120px 0',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 40px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.2em', color: '#06B6D4', textTransform: 'uppercase', marginBottom: 16 }}>
              Human-Centered Architecture
            </div>
            <h2 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-1.5px', color: '#F8FAFC', margin: '0 auto', maxWidth: 600 }}>
              Secure document sanitization. Built for trust.
            </h2>
          </div>

          {/* Bento Box Layout */}
          <div className="bento-grid">
            
            {/* Box 1 - Wide/Large */}
            <div className="bento-card" style={{ gridColumn: 'span 8' }}>
              <div className="bento-icon-wrapper" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <ScanSearch size={22} color="#22D3EE" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>
                Intelligent Detection
              </h3>
              <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: '90%' }}>
                Automatically detects sensitive information inside documents. 
                Identifies PII and PHI such as names, emails, IDs, account numbers, and confidential references in milliseconds across unstructured text.
              </p>
            </div>

            {/* Box 2 - Small */}
            <div className="bento-card" style={{ gridColumn: 'span 4' }}>
              <div className="bento-icon-wrapper" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <FileText size={22} color="#60A5FA" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>
                Context Preserved
              </h3>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                Intelligently anonymizes data while preserving meaningful context. Information is transformed into a safe structure, not blindly destroyed.
              </p>
            </div>

            {/* Box 3 - MASSIVE LOCAL-FIRST EMPHASIS (Span 8) */}
            <div className="bento-card" style={{ 
              gridColumn: 'span 8', 
              background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.1) 100%)',
              borderColor: 'rgba(6,182,212,0.3)',
              boxShadow: '0 12px 30px rgba(6,182,212,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="bento-icon-wrapper" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}>
                  <LockKeyhole size={22} />
                </div>
                <div style={{ 
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', 
                  borderRadius: '100px', fontSize: 12, fontWeight: 600, color: '#34D399', letterSpacing: '0.05em'
                }}>
                  ZERO-TRUST DESIGN
                </div>
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>
                Strictly Local-First
              </h3>
              <p style={{ fontSize: 17, color: '#CBD5E1', lineHeight: 1.6, margin: 0, maxWidth: '90%' }}>
                A privacy-first architecture built fundamentally on trust and protection. Designed explicitly for secure workflows where your sensitive data never leaves your machine. No cloud uploads, no API endpoints exposing your text—absolute local control.
              </p>
            </div>

            {/* Box 4 - Small */}
            <div className="bento-card" style={{ gridColumn: 'span 4' }}>
              <div className="bento-icon-wrapper" style={{ background: 'rgba(148,163,184,0.1)' }}>
                <Workflow size={22} color="#CBD5E1" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>
                Automated Workflows
              </h3>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                Reduces manual redaction effort through intelligent automation, creating cleaner, safer data for sharing and analysis.
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}