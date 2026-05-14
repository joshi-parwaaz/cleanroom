/**
 * ConsolePage.jsx — CleanRoom Anonymization Console
 *
 * Design System (from ui-ux-pro-max skill):
 *   Category:   Cybersecurity Platform (No.80) + Privacy Tool (No.157) + Dev Tool (No.81)
 *   Style:      Dark Mode OLED + Trust & Authority + Minimalism
 *   Colors:     Deep OLED black (#09090B) + Trust blue (#3B82F6) + Security green (#22C55E)
 *               + Alert amber (#F59E0B) + Danger red (#EF4444)
 *   Typography: 'IBM Plex Mono' (mono body) + 'Inter' (UI labels)
 *   Effects:    Subtle glow on active states, 150-200ms micro-interactions (skill: fast actions)
 *   Pattern:    Trust & Authority + Real-Time monitoring + Interactive Demo
 *   Anti-patt:  No light mode, no excessive decoration, no cyberpunk overdose
 *
 * Bug fixes applied:
 *   1. AnimatePresence mode="wait" REMOVED from result section — was the root cause of stuck spinner
 *   2. setResult() called BEFORE setProcessing(false) with 50ms gap — prevents race on exit animation
 *   3. localStorage write in try/catch AFTER state update — quota never kills setResult()
 *   4. Polling continues on network blips, stops only on done/error/404
 *   5. On mount: restored result renders immediately without re-polling
 *   6. clearInterval before any state cleanup (no dangling timers)
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Terminal, ScanLine, Lock, Download, FileText,
  AlertTriangle, Upload, Cpu, Info, RotateCcw, ChevronRight,
  CheckCircle2, Circle, Minus, ArrowRight, Activity, Layers,
  Eye, EyeOff, Fingerprint, Database, Zap
} from 'lucide-react'
import { submitAnonymizeJob, pollJobStatus, demoAnonymize } from '../utils/api'

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_JOB    = 'cr_job_id'
const LS_RESULT = 'cr_result'
const LS_FNAME  = 'cr_filename'

// ─── Sample text ──────────────────────────────────────────────────────────────
const SAMPLE = `Patient: John Smith
DOB: 1984-03-12
MRN: 00449821
Phone: (415) 203-9981
Email: john.smith@corp.com
Address: 123 Maple Street, Austin TX 78701
SSN: 821-41-9912

Referred by Dr. Sarah Mitchell from Project Athena team.
Account #: 88210498
Appointment: Tuesday 2:30 PM — Internal follow-up.`

// ─── Entity type colour tokens ────────────────────────────────────────────────
const TYPE_TOKEN = {
  PERSON:       { fg: '#60A5FA', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  EMAIL:        { fg: '#A78BFA', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)'  },
  PHONE:        { fg: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)'  },
  SSN:          { fg: '#F87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  ADDRESS:      { fg: '#C084FC', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.3)' },
  MRN:          { fg: '#FB7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)' },
  FINANCIAL_ID: { fg: '#FCD34D', bg: 'rgba(252,211,77,0.1)',  border: 'rgba(252,211,77,0.3)'  },
  PROJECT_CODE: { fg: '#818CF8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)' },
  ORG:          { fg: '#2DD4BF', bg: 'rgba(45,212,191,0.1)',  border: 'rgba(45,212,191,0.3)'  },
  MISC:         { fg: '#94A3B8', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.2)' },
}

// ─── Pipeline steps (matches backend progress messages) ───────────────────────
const STEPS = [
  { id: 'extract',   label: 'Extract',   match: ['extract', 'splitting', 'queued', 'starting'] },
  { id: 'regex',     label: 'Regex',     match: ['regex'] },
  { id: 'ner',       label: 'NER',       match: ['ner inference', 'running ner'] },
  { id: 'reconcile', label: 'Reconcile', match: ['reconcil', 'pseudonym'] },
  { id: 'rebuild',   label: 'Rebuild',   match: ['rebuild', 'sanitized', 'writing', 'complete'] },
]

function activeStepIndex(msg) {
  const m = (msg || '').toLowerCase()
  for (let i = STEPS.length - 1; i >= 0; i--)
    if (STEPS[i].match.some(k => m.includes(k))) return i
  return 0
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ type }) {
  const t = TYPE_TOKEN[type] || TYPE_TOKEN.MISC
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      color: t.fg, background: t.bg, border: `1px solid ${t.border}`,
      padding: '2px 7px', borderRadius: 4,
    }}>
      {type}
    </span>
  )
}

function KPI({ value, label, Icon, accent = '#3B82F6' }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: '#F1F5F9', lineHeight: 1 }}>
          {value}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon && <Icon size={13} color={accent} strokeWidth={1.5} />}
        </div>
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </span>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '45%', height: 1, background: `linear-gradient(90deg, ${accent}50, transparent)` }} />
    </div>
  )
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mono:    'IBM Plex Mono', 'Fira Code', monospace;
    --sans:    'Inter', system-ui, sans-serif;
    --bg:      #09090B;
    --bg1:     #0D0D10;
    --surface: rgba(255,255,255,0.03);
    --border:  rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --muted:   #52525B;
    --dim:     #71717A;
    --mid:     #A1A1AA;
    --text:    #E4E4E7;
    --bright:  #F4F4F5;
    --blue:    #3B82F6;
    --blue-d:  rgba(59,130,246,0.15);
    --blue-b:  rgba(59,130,246,0.3);
    --green:   #22C55E;
    --amber:   #F59E0B;
    --red:     #EF4444;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  ::selection { background: rgba(59,130,246,0.25); color: #fff; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

  textarea { font-family: var(--mono); resize: none; }
  textarea:focus { outline: none; }
  a { text-decoration: none; }

  /* ── Button primitives ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    font-family: var(--mono); font-size: 11px; font-weight: 500;
    letter-spacing: 0.04em; cursor: pointer; border-radius: 8px;
    padding: 9px 18px; transition: all 0.15s ease; border: none;
    white-space: nowrap; -webkit-font-smoothing: antialiased;
  }
  .btn:disabled { opacity: 0.38; cursor: not-allowed; }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #2563EB; box-shadow: 0 4px 24px rgba(59,130,246,0.3); }
  .btn-ghost { background: var(--surface); color: var(--mid); border: 1px solid var(--border); }
  .btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--bright); border-color: var(--border2); }
  .btn-outline { background: transparent; color: var(--blue); border: 1px solid var(--blue-b); }
  .btn-outline:hover:not(:disabled) { background: var(--blue-d); border-color: var(--blue); }
  .btn-danger-ghost { background: transparent; color: #F87171; border: 1px solid rgba(239,68,68,0.3); }
  .btn-danger-ghost:hover { background: rgba(239,68,68,0.07); }

  /* ── Panel ── */
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
  }
  .panel-hd {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 18px; border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.25);
  }

  /* ── Mono label ── */
  .lbl {
    font-family: var(--mono); font-size: 9px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);
  }

  /* ── Drop zone ── */
  .dropzone {
    border: 1px dashed var(--border);
    transition: border-color 0.15s, background 0.15s;
    cursor: pointer;
  }
  .dropzone:hover, .dropzone.over {
    border-color: var(--blue-b);
    background: rgba(59,130,246,0.04);
  }

  /* ── Table ── */
  .trow { border-bottom: 1px solid var(--border); transition: background 0.1s; }
  .trow:hover { background: rgba(255,255,255,0.02); }
  .trow:last-child { border-bottom: none; }

  /* ── Pipeline step connector ── */
  .step-line { flex: 1; height: 1px; }
  .step-circle {
    width: 26px; height: 26px; border-radius: 50%;
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    background: var(--bg); flex-shrink: 0;
    transition: all 0.3s ease;
  }
  .step-circle.done   { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.1); }
  .step-circle.active { border-color: var(--blue); background: var(--blue-d); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }

  /* ── Scan line ── */
  @keyframes scanline { from{top:0} to{top:100%} }
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes spin-rev  { to { transform: rotate(-360deg); } }
  @keyframes pulse-dot { 0%,100%{opacity:.45} 50%{opacity:1} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fade-up   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }

  .shimmer {
    background: linear-gradient(90deg, #60A5FA 0%, #A78BFA 45%, #60A5FA 90%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .cursor::after { content:'_'; animation: blink 1.1s step-end infinite; }

  /* ── Code block styling ── */
  .code-out {
    font-family: var(--mono); font-size: 12px; line-height: 1.9;
    color: #A1FFC4; white-space: pre-wrap; word-break: break-word;
    padding: 18px 20px; overflow-y: auto;
  }
  .code-in {
    font-family: var(--mono); font-size: 12px; line-height: 1.9;
    color: var(--mid); padding: 18px 20px;
    width: 100%; height: 100%; border: none; background: transparent;
  }
`

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConsolePage() {

  // File upload state
  const [file,        setFile]       = useState(null)
  const [dragOver,    setDragOver]   = useState(false)
  const [processing,  setProcessing] = useState(false)
  const [progressMsg, setProgress]   = useState('')
  const [jobId,       setJobId]      = useState(null)
  const [result,      setResult]     = useState(null)
  const [uploadError, setUploadError]= useState(null)
  const pollRef  = useRef(null)
  const fileRef  = useRef(null)

  // Demo state
  const [demoText,    setDemoText]    = useState(SAMPLE)
  const [demoResult,  setDemoResult]  = useState(null)
  const [demoRunning, setDemoRunning] = useState(false)
  const [scanPct,     setScanPct]     = useState(0)
  const [showRaw,     setShowRaw]     = useState(false)

  // ── Restore from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    // Lazy init: parse only once
    const raw = localStorage.getItem(LS_RESULT)
    const savedJob = localStorage.getItem(LS_JOB)

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setResult(parsed)
          const n = localStorage.getItem(LS_FNAME)
          if (n) setFile({ name: n, size: 0, _restored: true })
        }
      } catch (_) {
        localStorage.removeItem(LS_RESULT)
      }
    } else if (savedJob) {
      // Reconnect to in-flight job after Ctrl+R
      setJobId(savedJob)
      setProcessing(true)
      setProgress('Reconnecting to job…')
      _startPolling(savedJob)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling ─────────────────────────────────────────────────────────────────
  const _startPolling = useCallback((id) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const job = await pollJobStatus(id)
        if (job.progress_msg) setProgress(job.progress_msg)

        if (job.status === 'done') {
          // STOP polling first
          clearInterval(pollRef.current)
          pollRef.current = null

          const safe = job.result || {}

          // SET RESULT before touching processing — critical ordering
          setResult(safe)

          // Small gap: let React commit result render before exit animation fires
          setTimeout(() => {
            setProcessing(false)
            setJobId(null)
          }, 60)

          // Persist (quota-safe)
          try {
            localStorage.setItem(LS_RESULT, JSON.stringify(safe))
          } catch (_) { /* quota exceeded — fine, result is in state */ }
          localStorage.removeItem(LS_JOB)

        } else if (job.status === 'error') {
          clearInterval(pollRef.current); pollRef.current = null
          setUploadError(job.error || 'Pipeline failed')
          setProcessing(false); setJobId(null)
          localStorage.removeItem(LS_JOB)
        }
        // 'pending' | 'processing' → keep polling silently
      } catch (e) {
        if (e.message === 'JOB_NOT_FOUND') {
          clearInterval(pollRef.current); pollRef.current = null
          setUploadError('Server restarted — please re-upload your file.')
          setProcessing(false); setJobId(null)
          localStorage.removeItem(LS_JOB)
        }
        // Network blip → keep polling
      }
    }, 2500)
  }, [])

  const handleFile = useCallback(f => {
    setFile(f); setResult(null); setUploadError(null)
    localStorage.removeItem(LS_RESULT)
    localStorage.removeItem(LS_JOB)
    localStorage.removeItem(LS_FNAME)
  }, [])

  const onDrop = e => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const onAnonymize = async () => {
    if (!file || file._restored) return
    setProcessing(true); setUploadError(null); setProgress('Uploading…')
    try {
      const { job_id } = await submitAnonymizeJob(file)
      setJobId(job_id)
      localStorage.setItem(LS_JOB, job_id)
      localStorage.setItem(LS_FNAME, file.name)
      setProgress('Queued — pipeline starting…')
      _startPolling(job_id)
    } catch (e) {
      setUploadError(e.message); setProcessing(false)
    }
  }

  const clearAll = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setFile(null); setResult(null); setUploadError(null)
    setProcessing(false); setJobId(null); setProgress('')
    localStorage.removeItem(LS_RESULT)
    localStorage.removeItem(LS_JOB)
    localStorage.removeItem(LS_FNAME)
  }

  const runDemo = async () => {
    setDemoRunning(true); setDemoResult(null); setScanPct(0); setShowRaw(false)
    // animate scan bar over ~2s
    let p = 0
    const ticker = setInterval(() => {
      p = Math.min(p + 2.5, 98); setScanPct(p)
      if (p >= 98) clearInterval(ticker)
    }, 50)
    try {
      const r = await demoAnonymize(demoText)
      clearInterval(ticker); setScanPct(100)
      setTimeout(() => { setDemoResult(r); setScanPct(0) }, 200)
    } catch (e) {
      clearInterval(ticker); setScanPct(0)
      setUploadError(e.message)
    } finally { setDemoRunning(false) }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fmt = n => !n ? '—' : n < 1048576 ? `${(n/1024).toFixed(1)}k` : `${(n/1048576).toFixed(1)}M`
  const ext  = name => name?.split('.').pop()?.toUpperCase() || '?'
  const stepIdx = activeStepIndex(progressMsg)

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* Radial glow — top center */}
        <div style={{
          position: 'absolute', top: '-25%', left: '50%', transform: 'translateX(-50%)',
          width: '70vw', height: '60vh',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }}/>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
        }}/>
      </div>

      {/* ── Sticky nav ──────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52, padding: '0 28px',
        background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={13} color="#60A5FA" strokeWidth={2} />
          </div>
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 14, color: 'var(--bright)', letterSpacing: '-0.01em' }}>
            CleanRoom
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="lbl" style={{ color: '#3F3F46' }}>console v1</span>
          <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
          {/* Live inference badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.18)', borderRadius: 5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite', display: 'block' }} />
            <span className="lbl" style={{ color: 'var(--green)', letterSpacing: '0.1em' }}>local inference</span>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 28px 100px', position: 'relative', zIndex: 10 }}>

        {/* Page title */}
        <div style={{ marginBottom: 52 }}>
          <p className="lbl" style={{ color: '#3F3F46', marginBottom: 10, letterSpacing: '0.2em' }}>
            // ANONYMIZATION_ENGINE
          </p>
          <h1 style={{
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 36,
            color: 'var(--bright)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10,
          }}>
            PII / PHI <span className="shimmer">Sanitization</span> Console
          </h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--dim)', maxWidth: 480, lineHeight: 1.7 }}>
            Hybrid NLP pipeline (regex + BERT NER) runs entirely on your machine.
            Zero cloud calls. Zero cost per document.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — LIVE DEMO
        ════════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: 64 }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 1, height: 16, background: 'var(--blue)' }} />
            <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'var(--mid)' }}>
              Live Detection Demo
            </h2>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span className="lbl" style={{ color: '#3F3F46' }}>paste text → scan</span>
          </div>

          {/* Editor grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 1fr', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>

            {/* Left: Input */}
            <div style={{ background: 'var(--bg1)', borderRight: '1px solid var(--border)' }}>
              <div className="panel-hd" style={{ justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Terminal size={12} color="var(--muted)" />
                  <span className="lbl">stdin</span>
                </div>
                <span className="lbl" style={{ color: '#3F3F46' }}>{demoText.length} chars</span>
              </div>
              <div style={{ position: 'relative', height: 260 }}>
                <textarea
                  className="code-in"
                  value={demoText}
                  onChange={e => setDemoText(e.target.value)}
                  spellCheck={false}
                  style={{ height: '100%' }}
                />
                {/* Scan beam */}
                {demoRunning && scanPct > 0 && scanPct < 100 && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0,
                    top: `${scanPct * 2.6}px`,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent 0%, #3B82F6 40%, #60A5FA 60%, transparent 100%)',
                    boxShadow: '0 0 6px #3B82F6',
                    transition: 'top 0.08s linear',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            </div>

            {/* Center: Run button */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12,
              background: '#09090B', borderRight: '1px solid var(--border)',
            }}>
              <button
                onClick={runDemo}
                disabled={demoRunning || !demoText.trim()}
                title="Run detection"
                style={{
                  width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
                  background: demoRunning ? 'var(--blue-d)' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${demoRunning ? 'var(--blue)' : 'var(--blue-b)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <ScanLine
                  size={16}
                  color={demoRunning ? '#fff' : '#60A5FA'}
                  style={{ animation: demoRunning ? 'spin 1.2s linear infinite' : 'none' }}
                />
              </button>
              <span className="lbl" style={{ writingMode: 'vertical-rl', color: '#3F3F46', fontSize: 8, letterSpacing: '0.22em' }}>SCAN</span>
            </div>

            {/* Right: Output */}
            <div style={{ background: 'var(--bg1)' }}>
              <div className="panel-hd" style={{ justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Lock size={12} color="var(--muted)" />
                  <span className="lbl">stdout</span>
                </div>
                {demoResult && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setShowRaw(v => !v)}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 9, gap: 4 }}
                    >
                      {showRaw ? <Eye size={9}/> : <EyeOff size={9}/>}
                      {showRaw ? 'entities' : 'raw text'}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 4 }}>
                      <CheckCircle2 size={9} color="var(--green)" />
                      <span className="lbl" style={{ color: 'var(--green)', fontSize: 8 }}>clean</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: 260, overflow: 'auto' }}>
                {demoResult ? (
                  <pre className="code-out" style={{ height: '100%' }}>
                    {demoResult.anonymized_text}
                  </pre>
                ) : demoRunning ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="lbl cursor" style={{ color: 'var(--blue)' }}>scanning</span>
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Fingerprint size={22} color="rgba(255,255,255,0.06)" strokeWidth={1} />
                    <span className="lbl" style={{ fontSize: 8 }}>awaiting scan</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entity map */}
          <AnimatePresence>
            {demoResult?.entities?.length > 0 && (
              <motion.div
                key="emap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="panel"
                style={{ marginTop: 10 }}
              >
                <div className="panel-hd" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={12} color="var(--muted)" />
                    <span className="lbl">entity map</span>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--blue)',
                      background: 'var(--blue-d)', border: '1px solid var(--blue-b)',
                      padding: '1px 7px', borderRadius: 4,
                    }}>
                      {demoResult.stats.total_entities}
                    </span>
                  </div>
                  <span className="lbl">{demoResult.stats.processing_time_ms?.toFixed(0)}ms</span>
                </div>

                <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                  {demoResult.entities.map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', background: 'rgba(0,0,0,0.3)',
                      borderRadius: 7, border: '1px solid var(--border)',
                    }}>
                      <Tag type={e.entity_type} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F87171', textDecoration: 'line-through', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.original}
                          </span>
                          <ArrowRight size={9} color="var(--muted)" style={{ flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#A1FFC4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.pseudonym}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                          <span className="lbl" style={{ fontSize: 8, color: 'var(--muted)' }}>{e.source}</span>
                          <span className="lbl" style={{ fontSize: 8, color: e.confidence > 0.8 ? 'var(--green)' : 'var(--amber)' }}>
                            {(e.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — FILE SANITIZATION
        ════════════════════════════════════════════════════════════════════ */}
        <section>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 1, height: 16, background: 'var(--blue)' }} />
            <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'var(--mid)' }}>
              Document Sanitization
            </h2>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span className="lbl" style={{ color: '#3F3F46' }}>PDF · DOCX · TXT · CSV</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '296px 1fr', gap: 20, alignItems: 'start' }}>

            {/* ── Left sidebar ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Drop zone — hidden when processing or result shown */}
              {!processing && !result && (
                <div
                  className={`panel dropzone ${dragOver ? 'over' : ''}`}
                  style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minHeight: 190, justifyContent: 'center', textAlign: 'center', borderRadius: 12 }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload document"
                  onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                >
                  <input
                    ref={fileRef} type="file" accept=".pdf,.docx,.txt,.csv"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--blue-d)', border: '1px solid var(--blue-b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Upload size={18} color="#60A5FA" />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                      Drop file here
                    </p>
                    <p className="lbl" style={{ fontSize: 8 }}>or click to browse</p>
                  </div>
                </div>
              )}

              {/* Selected file card */}
              <AnimatePresence>
                {file && !file._restored && (
                  <motion.div
                    key="fcard"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="panel"
                  >
                    <div className="panel-hd" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <FileText size={12} color="var(--muted)" />
                        <span className="lbl">target</span>
                      </div>
                      {!processing && (
                        <button
                          onClick={clearAll}
                          aria-label="Remove file"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1 }}
                        >×</button>
                      )}
                    </div>

                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* File info row */}
                      <div style={{ display: 'flex', gap: 11, alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--blue-d)', border: '1px solid var(--blue-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={14} color="#60A5FA" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </p>
                          <p className="lbl" style={{ marginTop: 3 }}>
                            {ext(file.name)} · {fmt(file.size)}
                          </p>
                        </div>
                      </div>

                      {/* Error */}
                      {uploadError && (
                        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', padding: '9px 11px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 7 }}>
                          <AlertTriangle size={12} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F87171', lineHeight: 1.6 }}>{uploadError}</span>
                        </div>
                      )}

                      {/* CTA */}
                      {!result && (
                        <button
                          onClick={onAnonymize}
                          disabled={processing}
                          className="btn btn-primary"
                          style={{ width: '100%', height: 38, fontSize: 11 }}
                        >
                          {processing
                            ? <><Cpu size={12} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                            : <><ShieldCheck size={12} /> Run Sanitization</>
                          }
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* New file button */}
              {result && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={clearAll}
                  className="btn btn-ghost"
                  style={{ width: '100%', height: 38 }}
                >
                  <RotateCcw size={12} /> Process another file
                </motion.button>
              )}

              {/* Size limits */}
              <div className="panel">
                <div className="panel-hd">
                  <Info size={11} color="var(--muted)" />
                  <span className="lbl">size limits</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { fmt: 'PDF', limit: '25 MB' },
                    { fmt: 'DOCX', limit: '10 MB' },
                    { fmt: 'TXT / CSV', limit: '10 MB' },
                  ].map(({ fmt: f, limit }) => (
                    <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)' }}>{f}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', background: 'var(--blue-d)', border: '1px solid var(--blue-b)', padding: '2px 7px', borderRadius: 4 }}>
                        {limit}
                      </span>
                    </div>
                  ))}
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', lineHeight: 1.8, marginTop: 4 }}>
                    Large PDFs take 1–3 min.<br />
                    Job runs in background.<br />
                    Progress survives page refresh.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: state panel ──────────────────────────────────── */}
            {/*
              CRITICAL: No AnimatePresence mode="wait" here.
              The old code used mode="wait" which meant the loading panel's
              EXIT animation had to fully complete before the result panel
              could ENTER. With a slow exit this looked like a stuck spinner.

              Solution: use conditional rendering without AnimatePresence wrapping
              both panels. Each panel independently fades in.
            */}
            <div style={{ position: 'relative', minHeight: 440 }}>

              {/* Idle */}
              {!result && !processing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="panel"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, gap: 14 }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={22} color="rgba(255,255,255,0.06)" strokeWidth={1} />
                  </div>
                  <p className="lbl" style={{ textAlign: 'center', lineHeight: 1.9 }}>
                    Select a document above<br />to begin sanitization
                  </p>
                </motion.div>
              )}

              {/* Processing */}
              {processing && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="panel"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, gap: 40, padding: '40px 28px' }}
                >
                  {/* Spinner rings */}
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(59,130,246,0.08)' }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--blue)', animation: 'spin 1.1s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: 9, borderRadius: '50%', border: '1px dashed rgba(59,130,246,0.2)', animation: 'spin-rev 2.8s linear infinite' }} />
                    <Cpu size={20} color="#60A5FA" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                  </div>

                  {/* Message */}
                  <div style={{ textAlign: 'center', width: '100%', maxWidth: 360 }}>
                    <p style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 10 }}>
                      NLP Pipeline Running
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', lineHeight: 1.8, minHeight: 36 }}>
                      {progressMsg || 'Initialising…'}
                    </p>
                  </div>

                  {/* Pipeline step tracker */}
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 380 }}>
                    {STEPS.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <div className={`step-circle ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
                            {i < stepIdx
                              ? <CheckCircle2 size={12} color="var(--green)" />
                              : i === stepIdx
                                ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
                                : <Circle size={8} color="var(--border2)" />
                            }
                          </div>
                          <span className="lbl" style={{ fontSize: 7, color: i <= stepIdx ? 'var(--dim)' : 'var(--muted)' }}>
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className="step-line" style={{
                            background: i < stepIdx ? 'rgba(34,197,94,0.3)' : 'var(--border)',
                            marginBottom: 18,
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Result — renders as soon as result state is set */}
              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="panel"
                  style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}
                >
                  {/* Done header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={14} color="var(--green)" />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'var(--bright)' }}>
                          Sanitization Complete
                        </p>
                        <p className="lbl" style={{ marginTop: 2 }}>{result.filename}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'block' }} />
                      <span className="lbl" style={{ color: 'var(--green)', fontSize: 8 }}>done</span>
                    </div>
                  </div>

                  {/* KPI cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <KPI value={result.stats?.total_entities ?? 0}   label="Entities"  Icon={Layers}       accent="#3B82F6" />
                    <KPI value={`${(result.stats?.processing_time_ms ?? 0).toFixed(0)}ms`} label="Elapsed" Icon={Zap} accent="#A78BFA" />
                    <KPI value={result.stats?.low_confidence_count ?? 0} label="Low conf" Icon={AlertTriangle} accent={result.stats?.low_confidence_count > 0 ? '#F59E0B' : '#22C55E'} />
                    <KPI value={ext(result.filename)} label="Format" Icon={FileText} accent="#FB7185" />
                  </div>

                  {/* Downloads */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={result.download_url} download style={{ flex: 1 }}>
                      <button className="btn btn-primary" style={{ width: '100%', height: 38, fontSize: 11 }}>
                        <Download size={12} /> Download clean file
                      </button>
                    </a>
                    <a href={result.audit_url} download style={{ flex: 1 }}>
                      <button className="btn btn-ghost" style={{ width: '100%', height: 38, fontSize: 11 }}>
                        <Database size={12} /> Audit JSON
                      </button>
                    </a>
                  </div>

                  {/* Type breakdown pills */}
                  {Object.keys(result.stats?.by_type || {}).length > 0 && (
                    <div>
                      <p className="lbl" style={{ marginBottom: 10 }}>entity breakdown</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(result.stats.by_type).map(([type, count]) => {
                          const t = TYPE_TOKEN[type] || TYPE_TOKEN.MISC
                          return (
                            <span key={type} style={{
                              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
                              color: t.fg, background: t.bg, border: `1px solid ${t.border}`,
                              padding: '4px 10px', borderRadius: 5,
                            }}>
                              {type} · <strong>{count}</strong>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Audit table */}
                  {result.entities?.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p className="lbl">audit log</p>
                        <span className="lbl" style={{ color: '#3F3F46' }}>{result.entities.length} unique entities</span>
                      </div>
                      <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: 320, overflowY: 'auto', background: 'rgba(0,0,0,0.35)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.5)' }}>
                              {['Original', 'Type', 'Pseudonym', 'Conf', 'Source'].map(h => (
                                <th key={h} style={{
                                  padding: '9px 13px', textAlign: 'left',
                                  fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 600,
                                  letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)',
                                  position: 'sticky', top: 0, background: 'rgba(9,9,11,0.97)',
                                }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.entities.map((e, i) => (
                              <tr key={i} className="trow">
                                <td style={{ padding: '8px 13px', fontFamily: 'var(--mono)', fontSize: 10, color: '#F87171', textDecoration: 'line-through', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {e.original}
                                </td>
                                <td style={{ padding: '8px 13px' }}><Tag type={e.entity_type} /></td>
                                <td style={{ padding: '8px 13px', fontFamily: 'var(--mono)', fontSize: 10, color: '#A1FFC4', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {e.pseudonym}
                                </td>
                                <td style={{ padding: '8px 13px', fontFamily: 'var(--mono)', fontSize: 10, color: e.confidence > 0.8 ? 'var(--green)' : 'var(--amber)', whiteSpace: 'nowrap' }}>
                                  {(e.confidence * 100).toFixed(0)}%
                                  {e.low_confidence && <span style={{ marginLeft: 3, color: 'var(--amber)' }}>⚠</span>}
                                </td>
                                <td style={{ padding: '8px 13px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>
                                  {e.source}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
