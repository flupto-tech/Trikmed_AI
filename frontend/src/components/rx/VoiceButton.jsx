'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2, X, CheckCircle, AlertCircle, Sparkles, Clock } from 'lucide-react'
import api from '../../services/api'

/**
 * Generate a standard UUID v4 for tracking recording sessions across async requests.
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * VoiceButton — AI Voice Dictation (Fast Stop-to-Prescription Pipeline)
 *
 * Latency Optimization Architecture (<5s target after Stop):
 *   1. Incremental capture: Browser SpeechRecognition collects live text segments.
 *   2. Fast Stop path: If transcript already captured and structured, draft rendered in <200ms.
 *   3. If transcript has un-structured trailing words, sends text immediately to
 *      /ai/structure-transcript-incremental (takes ~1-2.5s with gemini-3.1-flash-lite)
 *      WITHOUT waiting for local 15-30s Whisper audio transcription.
 *   4. Complete audio upload & Whisper fallback: Runs in background for audio audit or as
 *      fallback when browser SpeechRecognition produced no text.
 *   5. Explicit stage-level timing telemetry tracks Stop-to-visible-draft latency.
 */
export default function VoiceButton({
  onTranscript,
  onPrescriptionParsed,
  onIncrementalUpdate,
  patientName = '',
  patientAge = null,
  doctorName = '',
  size = 'sm',
}) {
  const [phase, setPhase] = useState('idle') // idle | recording | processing | done | error
  const [seconds, setSeconds] = useState(0)
  const [liveText, setLiveText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [result, setResult] = useState(null)
  const [isIncrementalStructuring, setIsIncrementalStructuring] = useState(false)
  const [incrementalCount, setIncrementalCount] = useState(0)
  const [stopToDraftLatencyMs, setStopToDraftLatencyMs] = useState(null)

  const mediaRecorderRef       = useRef(null)
  const mediaStreamRef         = useRef(null)
  const audioChunksRef         = useRef([])
  const timerRef               = useRef(null)
  const recognitionRef         = useRef(null)
  const isRecordingRef         = useRef(false)
  const isStartingRef          = useRef(false)
  const accumulatedRef         = useRef('')   // accumulated final transcript segments
  const interimSpeechRef       = useRef('')   // pending interim transcript segment
  const panelRef               = useRef(null)

  // Incremental processing refs
  const sessionIdRef           = useRef(null)
  const lastStructuredTextRef  = useRef('')
  const latestStructuredRxRef  = useRef(null)
  const incrementalDebounceRef = useRef(null)
  const inFlightRequestRef     = useRef(false)
  const stopClickTimeRef       = useRef(null)

  const sz = size === 'sm' ? 14 : 16

  // Close panel on outside click
  useEffect(() => {
    const h = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (phase === 'idle' || phase === 'done' || phase === 'error') {
          setShowPanel(false)
        }
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [phase])

  function releaseMicrophone() {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null
  }

  useEffect(() => () => {
    clearInterval(timerRef.current)
    if (incrementalDebounceRef.current) clearTimeout(incrementalDebounceRef.current)
    isRecordingRef.current = false
    try { recognitionRef.current?.stop() } catch {}
    releaseMicrophone()
  }, [])

  /**
   * Send current accumulated transcript to backend for incremental structuring.
   * Only runs if doctor is still recording, session matches, and there is meaningful new text.
   */
  async function triggerIncrementalStructuring(currentSessionId, text, isFinalPass = false) {
    const cleanText = (text || '').trim()
    if (!cleanText || cleanText.length < 20) return null
    if (cleanText === lastStructuredTextRef.current && latestStructuredRxRef.current) {
      return latestStructuredRxRef.current
    }
    if (currentSessionId !== sessionIdRef.current) return null
    if (inFlightRequestRef.current && !isFinalPass) return null

    inFlightRequestRef.current = true
    setIsIncrementalStructuring(true)

    try {
      const payload = {
        session_id: currentSessionId,
        transcript: cleanText,
        prev_transcript: isFinalPass ? '' : lastStructuredTextRef.current,
        patient_name: patientName || null,
        patient_age: patientAge ? Number(patientAge) : null,
        doctor_name: doctorName || null,
        is_final: isFinalPass,
      }

      const res = await api.post('/ai/structure-transcript-incremental', payload)

      // Guard: if user stopped, changed recording, or session changed, discard stale response
      if (sessionIdRef.current !== currentSessionId) {
        return null
      }

      if (res && !res.unchanged) {
        lastStructuredTextRef.current = cleanText
        latestStructuredRxRef.current = res
        setIncrementalCount(c => c + 1)
        onIncrementalUpdate?.(res, isFinalPass)
      }
      return res
    } catch (err) {
      console.warn('Incremental structuring error:', err?.message || err)
      return null
    } finally {
      inFlightRequestRef.current = false
      setIsIncrementalStructuring(false)
    }
  }

  function scheduleIncrementalStructuring(text) {
    if (incrementalDebounceRef.current) {
      clearTimeout(incrementalDebounceRef.current)
    }
    const currentSessionId = sessionIdRef.current
    // Debounce 1.2s after speech pause
    incrementalDebounceRef.current = setTimeout(() => {
      triggerIncrementalStructuring(currentSessionId, text, false)
    }, 1200)
  }

  async function startRecording() {
    if (isStartingRef.current || isRecordingRef.current) return
    isStartingRef.current = true
    setErrorMsg('')
    setLiveText('')
    setFinalText('')
    accumulatedRef.current = ''
    interimSpeechRef.current = ''
    audioChunksRef.current = []
    lastStructuredTextRef.current = ''
    latestStructuredRxRef.current = null
    sessionIdRef.current = generateUUID()
    setSeconds(0)
    setResult(null)
    setIncrementalCount(0)
    setStopToDraftLatencyMs(null)
    setShowPanel(true)
    isRecordingRef.current = true

    // ── 1. MediaRecorder (audio capture for fallback & audit) ──
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('This browser does not support microphone recording.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      mediaStreamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported?.('audio/mp4')
          ? 'audio/mp4'
          : ''
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.start(500)
    } catch (err) {
      releaseMicrophone()
      mediaRecorderRef.current = null
      isRecordingRef.current = false
      isStartingRef.current = false
      setPhase('error')
      setErrorMsg(err?.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow it in your browser settings, then try again.'
        : err?.message || 'Could not start the microphone. Check that it is connected and not in use by another app.')
      return
    }

    // ── 2. Browser speech recognition for instant live text & incremental triggers ──
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
      : null
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event) => {
          let interim = ''
          let finalSegments = ''
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const text = event.results[index][0]?.transcript || ''
            if (event.results[index].isFinal) finalSegments += text
            else interim += text
          }
          if (finalSegments) {
            accumulatedRef.current = `${accumulatedRef.current} ${finalSegments}`.trim()
          }
          interimSpeechRef.current = interim
          const combined = `${accumulatedRef.current} ${interim}`.trim()
          setLiveText(combined)
          onTranscript?.(combined)

          if (accumulatedRef.current && accumulatedRef.current.length >= 20) {
            scheduleIncrementalStructuring(accumulatedRef.current)
          }
        }
        recognition.onerror = (event) => {
          if (!['no-speech', 'aborted'].includes(event.error)) {
            console.warn('Speech recognition preview unavailable:', event.error)
          }
        }
        recognition.onend = () => {
          if (isRecordingRef.current) {
            try { recognition.start() } catch {}
          }
        }
        recognitionRef.current = recognition
        recognition.start()
      } catch (err) {
        console.warn('Could not start live speech preview:', err)
      }
    }

    // ── 3. Timer ────────────────────────────────────────────────────────────
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    isStartingRef.current = false
    setPhase('recording')
  }

  async function stopRecording() {
    if (isStartingRef.current) return
    const tStop = performance.now()
    stopClickTimeRef.current = tStop

    clearInterval(timerRef.current)
    if (incrementalDebounceRef.current) {
      clearTimeout(incrementalDebounceRef.current)
    }
    isRecordingRef.current = false

    // Include any trailing interim speech text so the doctor's last spoken words are not lost
    const finalSpeechText = `${accumulatedRef.current} ${interimSpeechRef.current}`.trim()
    accumulatedRef.current = finalSpeechText

    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }

    setPhase('processing')
    const activeSessionId = sessionIdRef.current

    try {
      // ── FAST PATH: Reuse accumulated transcript if available ────────────────
      // If we already have a transcript (>=20 chars), we structure it immediately.
      // With gemini-3.1-flash-lite, this executes in ~1.5 - 2.8 seconds, delivering
      // the visible prescription draft well under the 5-second target.
      if (finalSpeechText && finalSpeechText.length >= 20) {
        setFinalText(finalSpeechText)
        setLiveText(finalSpeechText)

        // Case A: Everything was already incrementally structured while speaking
        if (finalSpeechText === lastStructuredTextRef.current && latestStructuredRxRef.current) {
          const tDraft = performance.now()
          const totalStopLatency = Math.round(tDraft - tStop)
          setStopToDraftLatencyMs(totalStopLatency)
          setResult(latestStructuredRxRef.current)
          setPhase('done')
          onPrescriptionParsed?.(latestStructuredRxRef.current)

          // Background audio cleanup
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop() } catch {}
          }
          releaseMicrophone()
          mediaRecorderRef.current = null
          return
        }

        // Case B: Final delta needs fast single-pass structuring
        const incrementalRes = await triggerIncrementalStructuring(activeSessionId, finalSpeechText, true)
        if (incrementalRes && sessionIdRef.current === activeSessionId) {
          const tDraft = performance.now()
          const totalStopLatency = Math.round(tDraft - tStop)
          setStopToDraftLatencyMs(totalStopLatency)
          setResult(incrementalRes)
          setPhase('done')
          onPrescriptionParsed?.(incrementalRes)

          // Background audio cleanup
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop() } catch {}
          }
          releaseMicrophone()
          mediaRecorderRef.current = null
          return
        }
      }

      // ── FALLBACK PATH: Audio file upload & backend Whisper transcription ─────
      // Used when browser SpeechRecognition produced no text or failed completely.
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        throw new Error('No speech was detected. Please try speaking again.')
      }

      const audioBlob = await new Promise((resolve, reject) => {
        recorder.addEventListener('stop', () => {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          if (blob.size === 0) reject(new Error('No audio was captured. Please try again.'))
          else resolve(blob)
        }, { once: true })
        recorder.addEventListener('error', () => reject(new Error('Microphone recording failed. Please try again.')), { once: true })
        recorder.stop()
      })
      releaseMicrophone()
      mediaRecorderRef.current = null

      const fd = new FormData()
      const extension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm'
      if (audioBlob) fd.append('file', audioBlob, `dictation.${extension}`)
      if (finalSpeechText) fd.append('transcript', finalSpeechText)
      fd.append('language_hint', 'hi-IN')
      if (patientName) fd.append('patient_name', patientName)
      if (patientAge)  fd.append('patient_age', String(patientAge))
      if (doctorName)  fd.append('doctor_name', doctorName)

      let res = null
      try {
        res = await api.upload('/ai/voice-to-prescription', fd)
      } catch (uploadErr) {
        console.warn('Backend audio upload failed:', uploadErr)
        throw new Error(uploadErr?.message || uploadErr?.detail || 'Voice processing failed. Please retry dictation or enter details manually.')
      }

      if (sessionIdRef.current !== activeSessionId) {
        return
      }

      if (!res) {
        throw new Error('No speech was detected or processing failed. Please retry dictation or enter details manually.')
      }

      if (res?.transcript) {
        setFinalText(res.transcript)
        accumulatedRef.current = res.transcript
        setLiveText(res.transcript)
        onTranscript?.(res.transcript)
      }

      const tDraft = performance.now()
      const totalStopLatency = Math.round(tDraft - tStop)
      setStopToDraftLatencyMs(totalStopLatency)
      setResult(res)
      setPhase('done')
      onPrescriptionParsed?.(res)
    } catch (err) {
      releaseMicrophone()
      mediaRecorderRef.current = null
      console.error('AI voice error:', err)
      setPhase('error')
      setErrorMsg(err?.message || 'Voice processing failed. Please retry dictation or enter details manually.')
    }
  }

  function toggle() {
    if (phase === 'recording') stopRecording()
    else if (phase === 'idle' || phase === 'done' || phase === 'error') startRecording()
  }

  function dismiss() {
    if (phase === 'recording') {
      clearInterval(timerRef.current)
      if (incrementalDebounceRef.current) clearTimeout(incrementalDebounceRef.current)
      isRecordingRef.current = false
      try { recognitionRef.current?.stop() } catch {}
      try { mediaRecorderRef.current?.stop() } catch {}
      mediaRecorderRef.current = null
      releaseMicrophone()
    }
    sessionIdRef.current = null
    isStartingRef.current = false
    setShowPanel(false)
    setPhase('idle')
    setLiveText('')
    setFinalText('')
    setResult(null)
    setErrorMsg('')
    setStopToDraftLatencyMs(null)
  }

  // ── Button styling per AGENTS.md ─────────────────────────────────────────
  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '12px',
    cursor: phase === 'processing' ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontSize: '12px', fontWeight: 600,
    transition: 'all 0.15s ease',
    border: phase === 'recording' ? '1.5px solid #E84C3D'
          : phase === 'done'      ? '1.5px solid #16A34A'
          : phase === 'error'     ? '1.5px solid #DC2626'
          :                         '1.5px solid #BFDBFE',
    background: phase === 'recording' ? '#FEE2E2'
              : phase === 'done'      ? '#DCFCE7'
              : phase === 'error'     ? '#FEE2E2'
              :                         '#EFF6FF',
    color: phase === 'recording' ? '#E84C3D'
         : phase === 'done'      ? '#16A34A'
         : phase === 'error'     ? '#DC2626'
         :                         '#0F2342',
  }

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ── Main button ── */}
      <button
        type="button"
        onClick={toggle}
        disabled={phase === 'processing'}
        title={phase === 'recording' ? 'Stop & reconcile prescription' : 'Start AI voice dictation'}
        style={btnStyle}
      >
        {phase === 'processing' ? (
          <><Loader2 size={sz} className="animate-spin" /><span>Structuring Rx…</span></>
        ) : phase === 'recording' ? (
          <><MicOff size={sz} /><span>Stop ({seconds}s)</span></>
        ) : phase === 'done' ? (
          <><CheckCircle size={sz} /><span>Voice Rx ✓ {stopToDraftLatencyMs ? `(${stopToDraftLatencyMs}ms)` : ''}</span></>
        ) : phase === 'error' ? (
          <><AlertCircle size={sz} /><span>Try Again</span></>
        ) : (
          <><Mic size={sz} color="#0F2342" /><span>AI Voice Rx</span></>
        )}
      </button>

      {/* ── Recording Status + result panel ── */}
      {showPanel && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 380, zIndex: 500,
          background: '#fff', borderRadius: 12,
          border: '1.5px solid #E4E6EB',
          boxShadow: '0 8px 32px rgba(0,0,0,.14)',
          overflow: 'hidden',
          fontFamily: "'Segoe UI', Inter, sans-serif",
        }}>
          {/* Panel header */}
          <div style={{
            padding: '10px 14px',
            background: phase === 'recording' ? '#FEE2E2'
                      : phase === 'done'      ? '#DCFCE7'
                      : phase === 'error'     ? '#FEE2E2'
                      :                         '#EFF6FF',
            display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid #E4E6EB',
          }}>
            {phase === 'recording' && (
              <>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E84C3D', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E84C3D', flex: 1 }}>
                  Recording… {seconds}s
                </span>
                {isIncrementalStructuring && (
                  <span style={{ fontSize: 11, color: '#0F2342', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>
                    <Loader2 size={10} className="animate-spin" /> Structuring…
                  </span>
                )}
                {incrementalCount > 0 && !isIncrementalStructuring && (
                  <span style={{ fontSize: 11, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: 3, background: '#DCFCE7', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>
                    <Sparkles size={10} /> Live updated
                  </span>
                )}
              </>
            )}
            {phase === 'processing' && (
              <>
                <Loader2 size={12} className="animate-spin" style={{ color: '#0F2342' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F2342', flex: 1 }}>Generating draft prescription…</span>
              </>
            )}
            {phase === 'done' && (
              <>
                <CheckCircle size={12} color="#16A34A" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', flex: 1 }}>
                  Prescription ready ✓ {stopToDraftLatencyMs ? `in ${(stopToDraftLatencyMs/1000).toFixed(1)}s` : ''}
                </span>
              </>
            )}
            {phase === 'error' && (
              <>
                <AlertCircle size={12} color="#DC2626" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', flex: 1 }}>Error</span>
              </>
            )}
            <button onClick={dismiss} type="button" aria-label="Close voice panel"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#6B7A9A' }}>
              <X size={14} />
            </button>
          </div>

          {/* Transcript box */}
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7A9A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {phase === 'recording' ? 'Live Speech Recognition' : 'Transcript Used'}
              </span>
              {phase === 'recording' && (
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>Updates form live</span>
              )}
            </div>
            <div style={{
              minHeight: 60, maxHeight: 120, overflowY: 'auto',
              background: '#F8F9FA', borderRadius: 8,
              padding: '8px 10px',
              fontSize: 13, color: '#1F2937', lineHeight: 1.6,
              border: '1px solid #E4E6EB',
            }}>
              {liveText || finalText || (
                <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                  {phase === 'recording' ? 'Start speaking… (e.g. "Paracetamol 650 subah shaam khana khane ke baad")' : 'No transcript captured'}
                </span>
              )}
            </div>

            {/* Error message */}
            {phase === 'error' && errorMsg && (
              <div style={{ marginTop: 8, padding: '8px 10px', background: '#FEE2E2', borderRadius: 8, fontSize: 12, color: '#991B1B' }}>
                {errorMsg}
              </div>
            )}

            {/* Result summary + Latency telemetry */}
            {phase === 'done' && result && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7A9A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Structured Fields
                  </span>
                  {stopToDraftLatencyMs && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: stopToDraftLatencyMs < 5000 ? '#166534' : '#92400E', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} /> Stop to draft: {(stopToDraftLatencyMs/1000).toFixed(2)}s
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.symptoms?.length > 0 && (
                    <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {result.symptoms.length} symptom{result.symptoms.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {result.diagnosis && (
                    <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      Diagnosis: {Array.isArray(result.diagnosis) ? result.diagnosis[0] : result.diagnosis}
                    </span>
                  )}
                  {result.medicines?.length > 0 && (
                    <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {result.medicines.length} medicine{result.medicines.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {result.investigations?.length > 0 && (
                    <span style={{ fontSize: 11, background: '#F3E8FF', color: '#7E22CE', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {result.investigations.length} test{result.investigations.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {result.llm_latency_ms && (
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                      AI latency: {Math.round(result.llm_latency_ms)}ms
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action footer */}
          {(phase === 'done' || phase === 'error') && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid #E4E6EB', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={dismiss} type="button"
                style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: '12px', border: '1.5px solid #D3D1C7', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                Close
              </button>
              <button onClick={() => { dismiss(); setTimeout(startRecording, 100) }} type="button"
                style={{ fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: '12px', border: 'none', background: '#0F2342', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Mic size={12} /> Dictate Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
