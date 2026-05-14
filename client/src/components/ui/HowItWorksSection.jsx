import { motion } from 'framer-motion'

const STEPS = [
  { n: '01', title: 'Upload',       body: 'Drop any PDF, DOCX, TXT, or CSV. Files stay local — nothing is sent to an external API.' },
  { n: '02', title: 'Detect',       body: 'A hybrid pipeline combines regex rules and a quantized BERT NER model to find every sensitive entity.' },
  { n: '03', title: 'Anonymize',    body: 'Each entity is replaced with a deterministic pseudonym. The same name always maps to the same replacement — document-wide consistency.' },
  { n: '04', title: 'Download',     body: 'Receive the sanitized document in its original format plus a structured JSON audit log.' },
]

const FEATURES = [
  { icon: '🔒', title: 'Zero Cloud Dependency',   body: 'All inference runs locally via ONNX-quantized models. Your documents never leave your infrastructure.' },
  { icon: '🎯', title: 'Recall-First Detection',  body: 'When in doubt, redact. Regex matches are always confirmed. NER detections below 0.65 confidence are still masked.' },
  { icon: '🔄', title: 'Entity Consistency',      body: 'SHA-256 + Faker generates deterministic pseudonyms. John Smith is always Marcus Webb, on every page.' },
  { icon: '📋', title: 'Audit Trail',             body: 'Every anonymization operation is logged with entity type, confidence score, and replacement. Exportable as JSON.' },
  { icon: '📁', title: 'Multi-Format Support',    body: 'Native handling for PDF (with OCR fallback), DOCX, TXT, and CSV. Output matches input format.' },
  { icon: '💰', title: 'Zero Cost',               body: 'Built entirely on open-source tooling and AWS Free Tier. No API keys, no usage bills.' },
]

const cardVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
}

export default function HowItWorksSection() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-24">
      {/* Pipeline Steps */}
      <div className="mb-24">
        <p className="font-mono text-xs tracking-widest uppercase text-ink-700/40 mb-3">Pipeline</p>
        <h2 className="text-4xl font-semibold text-ink-900 mb-16">How It Works</h2>

        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              className="glass p-6"
            >
              <div className="font-mono text-3xl font-light text-cyan-glow mb-4">{step.n}</div>
              <h3 className="font-semibold text-lg text-ink-900 mb-2">{step.title}</h3>
              <p className="text-sm text-ink-700/60 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detection Pipeline Visual */}
      <div className="mb-24 glass p-8">
        <p className="font-mono text-xs tracking-widest uppercase text-ink-700/40 mb-3">Detection Engine</p>
        <h2 className="text-2xl font-semibold text-ink-900 mb-8">Hybrid NLP Pipeline</h2>
        <div className="flex flex-wrap gap-2 items-center font-mono text-sm">
          {[
            'Size Guard', '→', 'File Router', '→', 'Text Extraction',
            '→', 'Chunking', '→', 'Regex Engine', '+', 'ONNX NER',
            '→', 'Reconciliation', '→', 'Pseudonym Registry',
            '→', 'Document Rebuild', '→', 'Output',
          ].map((step, i) => (
            step === '→' || step === '+' ? (
              <span key={i} className="text-ink-700/30">{step}</span>
            ) : (
              <span key={i} className="px-3 py-1.5 bg-warm-100 border border-warm-200 rounded-lg text-ink-800">
                {step}
              </span>
            )
          ))}
        </div>
      </div>

      {/* Entity Example */}
      <div className="mb-24">
        <p className="font-mono text-xs tracking-widest uppercase text-ink-700/40 mb-3">Example</p>
        <h2 className="text-2xl font-semibold text-ink-900 mb-8">Entity Consistency in Action</h2>
        <div className="glass overflow-hidden">
          <div className="grid grid-cols-4 bg-warm-100 border-b border-warm-200 px-6 py-3">
            {['Original Entity', 'Type', 'Pseudonym', 'Confidence'].map(h => (
              <span key={h} className="font-mono text-xs text-ink-700/50 uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {[
            { orig: 'John Smith',            type: 'PERSON',  pseudo: 'Marcus Webb',         conf: '0.94 + Regex' },
            { orig: 'john.smith@corp.com',   type: 'EMAIL',   pseudo: 'm.webb@nexacore.io',  conf: 'Regex' },
            { orig: '(415) 203-9981',        type: 'PHONE',   pseudo: '(312) 774-2205',      conf: 'Regex' },
            { orig: '123 Maple St, Austin', type: 'ADDRESS', pseudo: '47 Calloway Dr, Reno', conf: '0.81' },
            { orig: 'Project Helix',         type: 'PROJECT', pseudo: 'Project Vantage',     conf: '0.67 (low)' },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-4 px-6 py-4 border-b border-warm-100 hover:bg-warm-50 transition-colors">
              <span className="font-mono text-sm text-red-400/80">{row.orig}</span>
              <span className="font-mono text-xs px-2 py-0.5 self-center rounded-full bg-warm-100 text-ink-700/60 w-fit">
                {row.type}
              </span>
              <span className="font-mono text-sm text-cyan-glow">{row.pseudo}</span>
              <span className="font-mono text-xs text-ink-700/50">{row.conf}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <p className="font-mono text-xs tracking-widest uppercase text-ink-700/40 mb-3">Features</p>
        <h2 className="text-4xl font-semibold text-ink-900 mb-12">Built Different</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              className="glass p-6"
            >
              <div className="text-3xl mb-4">{feat.icon}</div>
              <h3 className="font-semibold text-ink-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-ink-700/60 leading-relaxed">{feat.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
