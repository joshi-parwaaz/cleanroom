const BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function submitAnonymizeJob(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/anonymize`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Submit failed')
  }
  return res.json()
}

export async function pollJobStatus(jobId) {
  const res = await fetch(`${BASE}/api/anonymize/${jobId}/status`)
  if (res.status === 404) throw new Error('JOB_NOT_FOUND')
  if (!res.ok) throw new Error(`Polling failed: ${res.status}`)
  const data = await res.json()
  // Defensive: log every poll for debugging
  console.log('[CleanRoom poll]', data.status, data.progress_msg,
    data.result ? '✓ result present' : '— no result yet')
  return data
}

export async function demoAnonymize(text) {
  const res = await fetch(`${BASE}/api/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Demo request failed')
  }
  return res.json()
}

export async function healthCheck() {
  const res = await fetch(`${BASE}/api/health`)
  return res.json()
}
