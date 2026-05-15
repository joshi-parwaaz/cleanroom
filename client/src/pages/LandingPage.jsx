import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Shield, ScanSearch, Terminal, Cpu, FileText, Workflow, LockKeyhole
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─── DATA ────────────────────────────────────────────────────────────────────
const dataFragments = [
  { id: 1, text: ["John Doe", "john.doe@company.com", "+1 (202) 555-0147"], redacted: ["[USER_01]", "[EMAIL_REDACTED]", "[PHONE_HIDDEN]"], x: -385, y: -175, rot: -4 },
  { id: 2, text: ["jane@email.com", "Tier 2 Support", "Dept: Engineering"], redacted: ["[EMAIL_REDACTED]", "Tier 2 Support", "Dept: Engineering"], x: -305, y: 145, rot: 3 },
  { id: 3, text: ["SSN: 821-41-9912", "Medical Record", "DOB: 1988-04-22"], redacted: ["[SSN_HIDDEN]", "Medical Record", "[PHI_REDACTED]"], x: -428, y: 32, rot: -2 },
  { id: 4, text: ["Account Number", "84992011034", "Routing: 021000021"], redacted: ["[ACCOUNT_HIDDEN]", "[DATA_SECURED]", "[ROUTING_HIDDEN]"], x: 375, y: 145, rot: 5 },
  { id: 5, text: ["Project Athena", "Internal Roadmap", "Clearance: Level 3"], redacted: ["[PROJECT_REDACTED]", "Internal Roadmap", "[CLEARANCE_HIDDEN]"], x: 305, y: -168, rot: -3 },
  { id: 6, text: ["Patient ID: 992", "MRN: 849922110504", "Dr. Sarah Mitchell"], redacted: ["[PATIENT_HIDDEN]", "[PHI_REDACTED]", "[PROVIDER_REDACTED]"], x: 408, y: -12, rot: 4 },
];

const revealWords = ['Privacy', 'Creates', 'Trust.'];

const orbTags = [
  { text: 'respect', left: '2%', top: '30%' },
  { text: 'security', left: '20%', top: '-18%' },
  { text: 'safe', left: '42%', top: '65%' },
  { text: 'trust', left: '63%', top: '-12%' },
  { text: 'protect', left: '81%', top: '32%' },
];

const SCRAMBLE_CHARS = '!@#$%^&*01█▓▒░<>?/\\|~`';

// ─── SCRAMBLE HOOK ───────────────────────────────────────────────────────────
function useScramble(targetText, trigger, duration = 800) {
  const [display, setDisplay] = useState(targetText);
  useEffect(() => {
    if (!trigger) { setDisplay(targetText); return; }
    let frame = 0;
    const totalFrames = Math.floor(duration / 16);
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      if (progress >= 1) { setDisplay(targetText); clearInterval(interval); return; }
      setDisplay(
        targetText.split('').map((char, i) =>
          i < Math.floor(targetText.length * progress)
            ? char
            : char === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        ).join('')
      );
    }, 16);
    return () => clearInterval(interval);
  }, [trigger, targetText]);
  return display;
}

// ─── SCRAMBLE SPAN ───────────────────────────────────────────────────────────
function ScrambleText({ text, trigger, duration, style }) {
  const display = useScramble(text, trigger, duration);
  return <span style={style}>{display}</span>;
}

// ─── PARTICLE STREAM (canvas dots along SVG lines) ───────────────────────────
function DataStreamCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  const CENTER = { x: 0.5, y: 0.5 };
  const lines = dataFragments.map(f => ({ tx: f.x, ty: f.y }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnParticle = (line) => ({
      progress: Math.random(),
      speed: 0.0012 + Math.random() * 0.0015,
      size: 1.5 + Math.random() * 2,
      opacity: 0,
      lineIdx: lines.indexOf(line),
      color: Math.random() > 0.5 ? '#06b6d4' : '#22d3ee',
    });

    // Init particles
    particlesRef.current = lines.flatMap(line =>
      Array.from({ length: 3 }, () => spawnParticle(line))
    );

    const tick = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!active) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const cx = w / 2, cy = h / 2;

      particlesRef.current.forEach(p => {
        const line = lines[p.lineIdx];
        const startX = cx + line.tx;
        const startY = cy + line.ty;
        const endX = cx, endY = cy;

        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          p.speed = 0.0012 + Math.random() * 0.0015;
          p.opacity = 0;
        }

        // Travel from card to center
        const t = p.progress;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;

        // Fade in then out
        p.opacity = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.opacity * 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Trailing glow
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.globalAlpha = p.opacity * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}
    />
  );
}

// ─── RADAR RINGS ─────────────────────────────────────────────────────────────
function RadarRings({ active }) {
  const [rings, setRings] = useState([]);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const id = counterRef.current++;
      setRings(prev => [...prev, { id, born: Date.now() }]);
      setTimeout(() => setRings(prev => prev.filter(r => r.id !== id)), 2200);
    }, 900);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 35 }}>
      {rings.map(ring => (
        <div key={ring.id} style={{
          position: 'absolute',
          width: 80, height: 80,
          borderRadius: '50%',
          border: '1.5px solid rgba(6,182,212,0.6)',
          animation: 'radarPulse 2.2s ease-out forwards',
        }} />
      ))}
    </div>
  );
}

// ─── AMBIENT PARTICLES ───────────────────────────────────────────────────────
function AmbientParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const particles = [];

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * (W || 1200),
        y: Math.random() * (H || 800),
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: 0.8 + Math.random() * 1.4,
        opacity: 0.08 + Math.random() * 0.18,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const now = Date.now() / 1000;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const op = p.opacity * (0.7 + 0.3 * Math.sin(now * 0.8 + p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${op})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
  );
}

// ─── CIRCUIT FLOOR ───────────────────────────────────────────────────────────
function CircuitFloor() {
  return (
    <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '45%', pointerEvents: 'none', zIndex: 2, opacity: 0.12 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
      <defs>
        <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Perspective grid lines horizontal */}
      {[0.1, 0.25, 0.42, 0.6, 0.78, 0.92].map((t, i) => {
        const y = 320 * t;
        const xSpread = 720 * (1 - t * 0.5);
        return <line key={i} x1={720 - xSpread} y1={y} x2={720 + xSpread} y2={y} stroke="url(#floorFade)" strokeWidth="0.8" />;
      })}
      {/* Vertical lines converging to vanishing point */}
      {Array.from({ length: 13 }, (_, i) => {
        const angle = -0.5 + i * (1 / 12);
        return <line key={i} x1={720} y1={0} x2={720 + angle * 1440} y2={320} stroke="url(#floorFade)" strokeWidth="0.6" />;
      })}
    </svg>
  );
}

// ─── BINARY RAIN (far background) ────────────────────────────────────────────
function BinaryRain() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const cols = Math.floor((W || 1440) / 22);
    const drops = Array.from({ length: cols }, () => Math.random() * -50);

    let raf;
    const tick = () => {
      ctx.fillStyle = 'rgba(11,17,32,0.06)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(6,182,212,0.09)';
      ctx.font = '10px DM Mono, monospace';
      drops.forEach((y, i) => {
        const char = Math.random() > 0.5 ? '1' : '0';
        ctx.fillText(char, i * 22, y * 14);
        if (y * 14 > H && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.15;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.55 }} />;
}

// ─── SCROLL PROGRESS BAR ─────────────────────────────────────────────────────
function ScrollProgress({ scrollRef }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const update = () => {
      const st = window.scrollY;
      const maxScroll = 8000;
      setProgress(Math.min(st / maxScroll, 1));
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, width: 3, height: '100vh', zIndex: 200, pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: `${progress * 100}%`, background: 'linear-gradient(to bottom, #06b6d4, #0891b2)', transition: 'height 0.1s linear', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }} />
    </div>
  );
}

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
function CustomCursor() {
  const ref = useRef(null);
  const dotRef = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (ref.current) gsap.to(ref.current, { x: e.clientX - 16, y: e.clientY - 16, duration: 0.4, ease: 'power2.out' });
      if (dotRef.current) gsap.to(dotRef.current, { x: e.clientX - 3, y: e.clientY - 3, duration: 0.08 });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <>
      <div ref={ref} style={{ position: 'fixed', width: 32, height: 32, pointerEvents: 'none', zIndex: 9999, top: 0, left: 0 }}>
        <svg viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
          <line x1="16" y1="2" x2="16" y2="8" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="24" x2="16" y2="30" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="16" x2="8" y2="16" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="16" x2="30" y2="16" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div ref={dotRef} style={{ position: 'fixed', width: 6, height: 6, background: '#22d3ee', borderRadius: '50%', pointerEvents: 'none', zIndex: 9999, top: 0, left: 0, boxShadow: '0 0 6px #06b6d4' }} />
    </>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  // Scene state for reactive components
  const [scanActive, setScanActive] = useState(false);
  const [scrambleActive, setScrambleActive] = useState(false);
  const [eyeBright, setEyeBright] = useState(false);

  const wrapRef    = useRef(null);
  const sunRef     = useRef(null);
  const darkRef    = useRef(null);
  const robotRef   = useRef(null);
  const headRef    = useRef(null);
  const eyeL       = useRef(null);
  const eyeR       = useRef(null);
  const eyeLInner  = useRef(null);
  const eyeRInner  = useRef(null);
  const beamRef    = useRef(null);
  const hudRef     = useRef(null);
  const rawRefs    = useRef([]);
  const redRefs    = useRef([]);
  const wordRefs   = useRef([]);
  const tagRefs    = useRef([]);
  const orbitRef   = useRef(null);
  const finalRef   = useRef(null);
  const ctaRef     = useRef(null);
  const beamSweepRef = useRef(null);
  const scanlineRef  = useRef(null);
  const bgTintRef    = useRef(null);
  const coolTintRef  = useRef(null);
  const flashRef     = useRef(null);

  useLayoutEffect(() => {
    gsap.config({ force3D: true });

    // Idle eye pulse
    gsap.to([eyeL.current, eyeR.current], {
      opacity: 0.4, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.6,
    });

    // Idle card float
    rawRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { y: `+=8`, x: `+=3`, rotation: `+=1`, duration: 4.5 + i * 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.3 });
    });

    // Scanline idle sweep on robot
    if (scanlineRef.current) {
      gsap.to(scanlineRef.current, { y: 220, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1 });
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=8000',
          scrub: 2,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            // Scene 3 scan active ~30–60%
            setScanActive(p > 0.28 && p < 0.62);
            // Scene 4 scramble ~55–70%
            setScrambleActive(p > 0.52 && p < 0.72);
            // Scene 6 eye bright ~85%+
            setEyeBright(p > 0.82);
          }
        },
      });

      // ── Initial state
      tl.set(robotRef.current,     { opacity: 0, y: 150, scale: 0.85 })
        .set(beamRef.current,      { opacity: 0, scaleX: 0 })
        .set(beamSweepRef.current, { opacity: 0, rotate: -22 })
        .set(hudRef.current,       { opacity: 0, x: 50 })
        .set(redRefs.current,      { opacity: 0, scale: 0.95, y: 20 })
        .set(wordRefs.current,     { opacity: 0, y: 30, scale: 0.9 })
        .set(tagRefs.current,      { opacity: 0, scale: 0.8 })
        .set(orbitRef.current,     { opacity: 0 })
        .set(finalRef.current,     { opacity: 0, y: 40 })
        .set(ctaRef.current,       { opacity: 0, y: 20 })
        .set(bgTintRef.current,    { opacity: 0 })
        .set(coolTintRef.current,  { opacity: 0 })
        .set(flashRef.current,     { opacity: 0 });

      // ── SCENE 2: ARRIVAL
      tl.to(robotRef.current, { opacity: 1, y: 0, scale: 1, duration: 2, ease: 'power2.out' }, 'arrival')
        .to(headRef.current,  { rotation: 12, duration: 1, ease: 'power2.out' }, 'arrival+=1')
        .to(headRef.current,  { rotation: -5, duration: 1.5, ease: 'sine.inOut' }, 'arrival+=2')
        .to(headRef.current,  { rotation: 0, duration: 1, ease: 'sine.inOut' }, 'arrival+=3.5');

      // ── SCENE 3: SCANNING — beam sweeps, danger red tint creeps in
      tl.to(sunRef.current,      { opacity: 0, duration: 1, ease: 'none' }, 'scan')
        .to(darkRef.current,     { opacity: 0.9, duration: 1, ease: 'none' }, 'scan')
        .to(bgTintRef.current,   { opacity: 0.18, duration: 1, ease: 'none' }, 'scan+=0.25')  // red danger tint
        .to(robotRef.current,    { x: -80, duration: 1, ease: 'power2.inOut' }, 'scan')
        .to(beamRef.current,     { opacity: 1, scaleX: 1, duration: 1, ease: 'power2.out' }, 'scan+=0.25')
        .to(beamSweepRef.current,{ opacity: 0.7, rotate: 22, duration: 1.5, ease: 'sine.inOut' }, 'scan+=0.25')
        .to(beamSweepRef.current,{ rotate: -22, duration: 1.5, ease: 'sine.inOut', repeat: 2, yoyo: true }, 'scan+=1.75')
        .to(hudRef.current,      { opacity: 1, x: 0, duration: 0.75, ease: 'back.out(1.2)' }, 'scan+=0.35')
        .to(rawRefs.current, {
            backgroundColor: '#082f49', color: '#a5f3fc', borderColor: '#06b6d4',
            stagger: 0.05, duration: 0.75, ease: 'power1.inOut',
          }, 'scan+=0.5');

      // ── SCENE 4: SANITIZATION — flash burst, scramble, cool tint
      tl.to(flashRef.current,    { opacity: 1, duration: 0.08, ease: 'none' }, 'clean')
        .to(flashRef.current,    { opacity: 0, duration: 0.4, ease: 'power2.out' }, 'clean+=0.08')
        .to(sunRef.current,      { opacity: 1, duration: 2, ease: 'none' }, 'clean')
        .to(darkRef.current,     { opacity: 0, duration: 2, ease: 'none' }, 'clean')
        .to(bgTintRef.current,   { opacity: 0, duration: 1.5, ease: 'none' }, 'clean')
        .to(coolTintRef.current, { opacity: 0.15, duration: 2, ease: 'none' }, 'clean+=0.5')  // teal cool tint
        .to(robotRef.current,    { x: 0, duration: 1.5, ease: 'power2.inOut' }, 'clean')
        .to(hudRef.current,      { opacity: 0, x: 50, duration: 1.2, ease: 'power2.in' }, 'clean')
        .to(beamSweepRef.current,{ opacity: 0, duration: 0.8 }, 'clean')
        .to(beamRef.current,     { opacity: 0.15, scaleX: 0.7, duration: 1.5, ease: 'none' }, 'clean')
        .to(rawRefs.current, {
            opacity: 0, scale: 0.95, y: '-=20', stagger: 0.1, duration: 1.5, ease: 'power2.in',
          }, 'clean+=0.5')
        .to(redRefs.current, {
            opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 1.5, ease: 'power2.out',
          }, 'clean+=1')
        .to(beamRef.current, { opacity: 0, duration: 1, ease: 'none' }, 'clean+=2.5');

      // ── SCENE 5: REVELATION
      tl.to(redRefs.current, {
            opacity: 0, y: '-=30', scale: 1.05, stagger: 0.1, duration: 2, ease: 'power2.inOut',
          }, 'reveal')
        .to(coolTintRef.current, { opacity: 0, duration: 1.5 }, 'reveal')
        .to(darkRef.current,     { opacity: 0.75, duration: 2, ease: 'none' }, 'reveal')
        .to(sunRef.current,      { opacity: 0.1, duration: 2, ease: 'none' }, 'reveal')
        .to(wordRefs.current, {
            opacity: 1, y: 0, scale: 1, stagger: 0.15, duration: 2, ease: 'back.out(1.2)',
          }, 'reveal+=1.5')
        .to(tagRefs.current, {
            opacity: 1, scale: 1, stagger: 0.1, duration: 1.5, ease: 'power2.out',
          }, 'reveal+=2.5')
        .to(orbitRef.current, { opacity: 1, duration: 2, ease: 'none' }, 'reveal+=2');

      // ── SCENE 6: COMPLETION — robot slides, eyes ignite
      tl.to(wordRefs.current,    { opacity: 0, y: -20, stagger: 0.05, duration: 1, ease: 'power2.in' }, 'complete')
        .to(tagRefs.current,     { opacity: 0, scale: 0.9, stagger: 0.05, duration: 1, ease: 'none' }, 'complete')
        .to(orbitRef.current,    { opacity: 0, duration: 1, ease: 'none' }, 'complete')
        .to(darkRef.current,     { opacity: 0, duration: 2, ease: 'none' }, 'complete')
        .to(sunRef.current,      { opacity: 1, duration: 2, ease: 'none' }, 'complete')
        .to(robotRef.current, { x: '-38vw', y: 88, scale: 0.9, duration: 2.5, ease: 'power3.inOut' }, 'complete+=0.5')
        .to(headRef.current,     { rotation: 13, duration: 1.5, ease: 'power2.inOut' }, 'complete+=1.5')
        .to([eyeL.current, eyeR.current], { opacity: 1, scale: 1.3, duration: 0.5, ease: 'power3.out' }, 'complete+=2')
        .to([eyeLInner.current, eyeRInner.current], { fill: '#22d3ee', duration: 0.3 }, 'complete+=2')
        .to(finalRef.current,    { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 'complete+=1.5')
        .to(ctaRef.current,      { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 'complete+=2');

    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      background: '#0B1120', color: '#F8FAFC', overflowX: 'hidden', minHeight: '100vh', userSelect: 'none',
      cursor: 'none',
    }}>
      <CustomCursor />
      <ScrollProgress scrollRef={wrapRef} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::selection { background: #06B6D4; color: #020617; }
        html { scroll-behavior: smooth; }
        body { cursor: none !important; }
        a, button { cursor: none !important; }

        .card-raw, .card-red, .tag-pill, .hud-panel, .robot-layer, .fluid-layer {
          will-change: transform, opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .card-raw {
          position: absolute; width: 224px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 16px;
          padding: 17px 19px; font-size: 13px; line-height: 1.62; color: #F8FAFC; font-weight: 500;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        /* Danger glow breathing on raw cards */
        @keyframes dangerPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 0 rgba(239,68,68,0); }
          50%       { box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 18px 4px rgba(239,68,68,0.22); }
        }
        .card-raw.danger { animation: dangerPulse 2.4s ease-in-out infinite; }
        .card-red {
          position: absolute; width: 224px;
          background: rgba(8, 47, 73, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 16px;
          padding: 17px 19px; font-size: 13px; line-height: 1.62; font-weight: 500;
          box-shadow: 0 0 18px rgba(6, 182, 212, 0.18);
          color: #CFFAFE;
        }
        /* Cleared float upward on redacted cards */
        @keyframes cardClear { 0% { transform: translateY(0); } 100% { transform: translateY(-6px); } }

        .tag-pill {
          position: absolute;
          background: rgba(8,47,73,0.8); border: 1px solid rgba(6,182,212,0.42);
          color: #a5f3fc; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.1em;
          padding: 7px 18px; border-radius: 100px; white-space: nowrap;
        }
        @keyframes tagOrbit {
          0%   { transform: translateX(0px) translateY(0px); }
          25%  { transform: translateX(6px) translateY(-3px); }
          50%  { transform: translateX(0px) translateY(-6px); }
          75%  { transform: translateX(-6px) translateY(-3px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        .tag-pill { animation: tagOrbit 5s ease-in-out infinite; }
        .tag-pill:nth-child(1) { animation-delay: 0s; }
        .tag-pill:nth-child(2) { animation-delay: -1s; }
        .tag-pill:nth-child(3) { animation-delay: -2s; }
        .tag-pill:nth-child(4) { animation-delay: -3s; }
        .tag-pill:nth-child(5) { animation-delay: -4s; }

        .hud-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid rgba(6,182,212,0.12);
        }
        @keyframes countUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .hud-row span:last-child { animation: countUp 0.4s ease-out both; }
        .hud-row:nth-child(2) span:last-child { animation-delay: 0.1s; }
        .hud-row:nth-child(3) span:last-child { animation-delay: 0.2s; }
        .hud-row:nth-child(4) span:last-child { animation-delay: 0.3s; }
        .hud-row:nth-child(5) span:last-child { animation-delay: 0.4s; }
        .hud-row:nth-child(6) span:last-child { animation-delay: 0.5s; }

        /* Radar ring animation */
        @keyframes radarPulse {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(8); opacity: 0; }
        }

        /* Scanline sweep */
        @keyframes scanlineSweep {
          0%   { top: 0%; opacity: 0.6; }
          50%  { opacity: 0.9; }
          100% { top: 88%; opacity: 0; }
        }

        /* Glitch on words */
        @keyframes glitch1 {
          0%, 90%, 100% { clip-path: none; transform: none; }
          92% { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translate(-2px, 0); }
          94% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translate(2px, 0); }
          96% { clip-path: none; transform: none; }
        }
        .word-glitch { animation: glitch1 8s ease-in-out infinite; }
        .word-glitch:nth-child(2) { animation-delay: -2.5s; }
        .word-glitch:nth-child(3) { animation-delay: -5s; }

        /* Buttons */
        .btn-cta-dark {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 16px 40px; background: #06B6D4; color: #082F49;
          border: none; border-radius: 100px; font-size: 15px; font-weight: 700; letter-spacing: -0.2px;
          cursor: none; transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          font-family: inherit; box-shadow: 0 0 20px rgba(6,182,212,0.4);
        }
        .btn-cta-dark:hover { background: #22D3EE; transform: translateY(-2px); box-shadow: 0 0 30px rgba(6,182,212,0.6); }
        .btn-cta-light {
          display: inline-flex; align-items: center;
          padding: 16px 40px; background: transparent; color: #F8FAFC;
          border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 100px;
          font-size: 15px; font-weight: 600; cursor: none; transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
          font-family: inherit;
        }
        .btn-cta-light:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); border-color: #F8FAFC; }
        .btn-console-hdr {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 22px; background: rgba(255,255,255,0.1); color: #F8FAFC;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; font-size: 13px; font-weight: 600;
          cursor: none; transition: background 0.2s ease; font-family: inherit;
        }
        .btn-console-hdr:hover { background: rgba(255,255,255,0.15); }

        /* Bento */
        .bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; margin-top: 60px; }
        .bento-card {
          background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 24px;
          padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          display: flex; flex-direction: column; color: #F8FAFC;
        }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-color: rgba(6,182,212,0.3); }
        .bento-icon-wrapper {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
        }

        /* Hex grid background */
        .hex-bg {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34z' fill='none' stroke='rgba(6,182,212,0.04)' stroke-width='1'/%3E%3Cpath d='M28 100L0 84V50l28-16 28 16v34z' fill='none' stroke='rgba(6,182,212,0.04)' stroke-width='1'/%3E%3C/svg%3E");
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
            border: '1.5px solid rgba(6,182,212,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(6,182,212,0.3)',
          }}>
            <Shield size={14} color="#22D3EE" strokeWidth={2} style={{ margin: 'auto' }} />
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
          <div style={{ position: 'absolute', inset: 0, background: '#0B1120' }} />

          {/* Binary rain — far background */}
          <BinaryRain />

          {/* Hex grid texture */}
          <div className="hex-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />

          {/* Radial gradient glows */}
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)' }} />

          {/* Perspective circuit floor */}
          <CircuitFloor />

          {/* Ambient floating particles */}
          <AmbientParticles />

          {/* Subtle tech grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.025) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
          }} />

          {/* Vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />
        </div>

        {/* ── TINT LAYERS ──────────────────────────────────────────────── */}
        {/* Danger red tint (scan scene) */}
        <div ref={bgTintRef} className="fluid-layer" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.3) 0%, transparent 70%)', zIndex: 4, pointerEvents: 'none' }} />
        {/* Cool teal tint (post-clean) */}
        <div ref={coolTintRef} className="fluid-layer" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.2) 0%, transparent 70%)', zIndex: 4, pointerEvents: 'none' }} />
        {/* Radial flash burst */}
        <div ref={flashRef} className="fluid-layer" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(6,182,212,0.7) 0%, transparent 60%)', zIndex: 60, pointerEvents: 'none' }} />

        {/* ── GLOW OVERLAY ─────────────────────────────────────────── */}
        <div ref={sunRef} className="fluid-layer" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '0%', right: '10%', width: '40vw', height: '100vh', background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, transparent 70%)', mixBlendMode: 'screen' }} />
        </div>

        {/* ── DARKNESS OVERLAY ─────────────────────────────────────────── */}
        <div ref={darkRef} className="fluid-layer" style={{ position: 'absolute', inset: 0, background: '#050810', zIndex: 6, opacity: 0, pointerEvents: 'none', mixBlendMode: 'multiply' }} />

        {/* ── DATA STREAM PARTICLES ────────────────────────────────────── */}
        <DataStreamCanvas active={scanActive} />

        {/* ── DATA CARDS ───────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {/* SVG connection lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', opacity: 0.22, pointerEvents: 'none' }}>
            {dataFragments.map((frag, i) => (
              <line key={i}
                x1="50%" y1="50%"
                x2={`calc(50% + ${frag.x}px)`}
                y2={`calc(50% + ${frag.y}px)`}
                stroke={scanActive ? '#06b6d4' : '#A8A29E'}
                strokeWidth="0.8"
                strokeDasharray="4 7"
                style={{ transition: 'stroke 1s ease' }}
              />
            ))}
          </svg>

          {dataFragments.map((frag, i) => (
            <div key={frag.id} style={{ position: 'absolute' }}>
              {/* Raw card — danger glow when scanning */}
              <div
                ref={el => rawRefs.current[i] = el}
                className={`card-raw${scanActive ? ' danger' : ''}`}
                style={{ transform: `translate(${frag.x}px, ${frag.y}px) rotate(${frag.rot}deg)` }}
              >
                {frag.text.map((line, j) => (
                  <span key={j} style={{ display: 'block', color: j === 0 ? '#F8FAFC' : '#94A3B8' }}>{line}</span>
                ))}
              </div>

              {/* Redacted card — with scramble effect */}
              <div
                ref={el => redRefs.current[i] = el}
                className="card-red"
                style={{ transform: `translate(${frag.x}px, ${frag.y}px) rotate(${frag.rot}deg)` }}
              >
                {frag.redacted.map((line, j) => {
                  const isTag = line.startsWith('[');
                  return (
                    <ScrambleText
                      key={j}
                      text={line}
                      trigger={scrambleActive}
                      duration={700 + i * 120 + j * 80}
                      style={{
                        display: 'block',
                        color: isTag ? '#0891b2' : '#164e63',
                        fontFamily: isTag ? "'DM Mono', monospace" : 'inherit',
                        fontSize: isTag ? 11 : 13,
                        letterSpacing: isTag ? '0.06em' : 'normal',
                        fontWeight: isTag ? 600 : 500,
                        marginTop: isTag ? 3 : 0,
                      }}
                    />
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

        {/* ── RADAR RINGS ──────────────────────────────────────────────── */}
        <RadarRings active={scanActive} />

        {/* ── ROBOT ────────────────────────────────────────────────────── */}
        <div ref={robotRef} className="robot-layer fluid-layer" style={{ position: 'absolute', zIndex: 42, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Beam — static fill */}
          <div ref={beamRef} className="fluid-layer" style={{
            position: 'absolute', top: 64, left: -490, width: 1060, height: 390, pointerEvents: 'none', transformOrigin: 'right center',
            mixBlendMode: 'screen', clipPath: 'polygon(0% 11%, 100% 46%, 100% 54%, 0% 89%)',
            background: 'linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.1) 35%, rgba(6,182,212,0.42) 82%, rgba(6,182,212,0.72) 100%)',
          }} />

          {/* Beam sweep — rotates to simulate arc */}
          <div ref={beamSweepRef} className="fluid-layer" style={{
            position: 'absolute', top: 64, left: -490, width: 1060, height: 390, pointerEvents: 'none', transformOrigin: 'right center',
            mixBlendMode: 'screen', clipPath: 'polygon(0% 18%, 100% 48%, 100% 52%, 0% 82%)',
            background: 'linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.06) 40%, rgba(6,182,212,0.22) 80%, rgba(6,182,212,0.5) 100%)',
          }} />

          <svg width="210" height="252" viewBox="0 0 210 252" fill="none" style={{ position: 'relative', zIndex: 2 }}>
            {/* Scanline sweep over robot body */}
            <defs>
              <clipPath id="robotBody">
                <rect x="28" y="22" width="154" height="214" rx="14" />
              </clipPath>
              <linearGradient id="scanlineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(6,182,212,0)" />
                <stop offset="45%" stopColor="rgba(6,182,212,0.35)" />
                <stop offset="55%" stopColor="rgba(6,182,212,0.35)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0)" />
              </linearGradient>
            </defs>

            {/* Treads/Base */}
            <rect x="28" y="200" width="154" height="36" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
            <rect x="22" y="204" width="46" height="28" rx="10" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />
            <rect x="142" y="204" width="46" height="28" rx="10" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />
            {[0,1,2,3,4].map(j => <rect key={j} x={36+j*28} y={207} width={13} height={22} rx={3} fill="#22d3ee" opacity="0.3" />)}

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
              <circle ref={eyeLInner} cx="78" cy="64" r="5.5" fill="#cffafe" />
              <circle cx="81" cy="61" r="2.2" fill="white" opacity="0.92" />

              <circle cx="132" cy="64" r="14" fill="#082f49" />
              <circle ref={eyeR} cx="132" cy="64" r="11" fill="#06b6d4" />
              <circle ref={eyeRInner} cx="132" cy="64" r="5.5" fill="#cffafe" />
              <circle cx="135" cy="61" r="2.2" fill="white" opacity="0.92" />

              {/* Antenna — pulse when eye bright */}
              <line x1="105" y1="22" x2="105" y2="7" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="105" cy="4" r="4.8" fill={eyeBright ? '#22d3ee' : '#10b981'} style={{ transition: 'fill 0.5s ease', filter: eyeBright ? 'drop-shadow(0 0 6px #06b6d4)' : 'none' }} />
            </g>

            {/* Scanline sweep */}
            <rect ref={scanlineRef} x="28" y="22" width="154" height="18" fill="url(#scanlineGrad)" clipPath="url(#robotBody)" style={{ mixBlendMode: 'screen' }} />
          </svg>

        </div>

        {/* ── SCENE 5: REVELATION WORDS ───────────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 28, pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
            {revealWords.map((word, i) => (
              <div key={word} ref={el => wordRefs.current[i] = el} className="word-glitch" style={{
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
            {orbTags.map((tag, i) => (
              <div key={tag.text} ref={el => tagRefs.current[i] = el} className="tag-pill" style={{ left: tag.left, top: tag.top }}>{tag.text}</div>
            ))}
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
                width: 46, height: 46, borderRadius: '50%', background: 'rgba(6,182,212,0.1)',
                border: '2px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        background: '#0B1120', borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '120px 0', position: 'relative', zIndex: 10,
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

          <div className="bento-grid">
            <div className="bento-card" style={{ gridColumn: 'span 8' }}>
              <div className="bento-icon-wrapper" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <ScanSearch size={22} color="#22D3EE" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>Intelligent Detection</h3>
              <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: '90%' }}>
                Automatically detects sensitive information inside documents. Identifies PII and PHI such as names, emails, IDs, account numbers, and confidential references in milliseconds across unstructured text.
              </p>
            </div>
            <div className="bento-card" style={{ gridColumn: 'span 4' }}>
              <div className="bento-icon-wrapper" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <FileText size={22} color="#60A5FA" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>Context Preserved</h3>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                Intelligently anonymizes data while preserving meaningful context. Information is transformed into a safe structure, not blindly destroyed.
              </p>
            </div>
            <div className="bento-card" style={{ gridColumn: 'span 8', background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.1) 100%)', borderColor: 'rgba(6,182,212,0.3)', boxShadow: '0 12px 30px rgba(6,182,212,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="bento-icon-wrapper" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}>
                  <LockKeyhole size={22} />
                </div>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '100px', fontSize: 12, fontWeight: 600, color: '#34D399', letterSpacing: '0.05em' }}>
                  ZERO-TRUST DESIGN
                </div>
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>Strictly Local-First</h3>
              <p style={{ fontSize: 17, color: '#CBD5E1', lineHeight: 1.6, margin: 0, maxWidth: '90%' }}>
                A privacy-first architecture built fundamentally on trust and protection. Designed explicitly for secure workflows where your sensitive data never leaves your machine. No cloud uploads, no API endpoints exposing your text—absolute local control.
              </p>
            </div>
            <div className="bento-card" style={{ gridColumn: 'span 4' }}>
              <div className="bento-icon-wrapper" style={{ background: 'rgba(148,163,184,0.1)' }}>
                <Workflow size={22} color="#CBD5E1" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.5px' }}>Automated Workflows</h3>
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