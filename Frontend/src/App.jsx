import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.5-2L20 12M4 12l2.9 5a7 7 0 0 0 11.5-2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const inputRef = useRef(null)
  const previewUrlRef = useRef('')

  useEffect(() => {
    let active = true

    async function checkApi() {
      try {
        const response = await fetch(`${API_URL}/health`)
        if (!response.ok) throw new Error(`Backend returned ${response.status}`)
        const health = await response.json()
        if (active) setApiStatus(health.status === 'ok' ? 'online' : 'offline')
      } catch {
        if (active) setApiStatus('offline')
      }
    }

    checkApi()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function selectFile(selectedFile) {
    if (!selectedFile) return
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setPreview('')
    setError('')
    setResult(null)
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setFile(null)
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('This image is larger than 10 MB. Choose a smaller file.')
      return
    }
    previewUrlRef.current = URL.createObjectURL(selectedFile)
    setPreview(previewUrlRef.current)
    setFile(selectedFile)
  }

  async function analyzeImage(event) {
    event.preventDefault()
    if (!file || isAnalyzing) return

    setIsAnalyzing(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || `The server returned ${response.status}.`)
      }
      if (!data.predicted_class || !Array.isArray(data.scores)) {
        throw new Error('The backend response did not include a prediction and scores.')
      }
      setResult(data)
      setApiStatus('online')
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? `Could not reach the backend at ${API_URL}. Start the API and try again.`
          : requestError.message,
      )
      setApiStatus('offline')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function resetTest() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setFile(null)
    setPreview('')
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const topScore = result?.scores?.[0]?.score ?? 0

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="DermaLab home">
          <span className="brand-mark"><Icon name="shield" size={19} /></span>
          <span>derma<span className="brand-light">lab</span></span>
          <span className="brand-tag">MODEL TESTER</span>
        </a>
        <div className={`api-pill api-${apiStatus}`} aria-live="polite">
          <span className="status-dot" />
          {apiStatus === 'online' && 'API connected'}
          {apiStatus === 'offline' && 'API unavailable'}
          {apiStatus === 'checking' && 'Checking API'}
        </div>
      </header>

      <main>
        <section className="intro">
          <p className="eyebrow"><span /> SKIN LESION CLASSIFICATION</p>
          <h1>Clarity starts<br />with a closer look<span>.</span></h1>
          <p className="intro-copy">
            Explore how your skin lesion model responds to an image. Add a sample
            to see its predicted class and the complete score breakdown.
          </p>
          <div className="intro-meta">
            <span><i /> LOCAL MODEL</span>
            <span>JPEG · PNG · WEBP</span>
            <span>MAX 10 MB</span>
          </div>
        </section>

        <div className="workspace">
          <section className="panel upload-panel" aria-labelledby="upload-heading">
            <div className="panel-heading">
              <div>
                <span className="step-label">01 / INPUT</span>
                <h2 id="upload-heading">Image sample</h2>
              </div>
              {file && (
                <button className="text-button" type="button" onClick={resetTest}>
                  Remove image
                </button>
              )}
            </div>

            <form onSubmit={analyzeImage}>
              <input
                ref={inputRef}
                className="visually-hidden"
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={(event) => selectFile(event.target.files?.[0])}
                aria-label="Choose an image"
              />
              {apiStatus === 'offline' && (
                <div className="api-warning" role="status">
                  <span className="warning-dot" />
                  <span><strong>Backend not detected.</strong> Start the API at {API_URL} to run a test.</span>
                </div>
              )}
              <button
                className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${preview ? 'has-preview' : ''}`}
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                  selectFile(event.dataTransfer.files?.[0])
                }}
                aria-label="Drop an image here or browse files"
              >
                {preview ? (
                  <img className="image-preview" src={preview} alt="Selected skin lesion sample" />
                ) : (
                  <span className="upload-prompt">
                    <span className="upload-icon"><Icon name="upload" size={23} /></span>
                    <strong>Drop your image here</strong>
                    <span>or <span className="browse-link">choose a file</span></span>
                    <span className="file-types">Dermoscopic images work best · up to 10 MB</span>
                  </span>
                )}
              </button>

              {file && (
                <div className="file-row">
                  <span className="file-icon"><Icon name="image" size={17} /></span>
                  <span className="file-details">
                    <strong>{file.name}</strong>
                    <span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to analyze</span>
                  </span>
                  <span className="file-ready"><Icon name="check" size={16} /></span>
                </div>
              )}

              {error && <p className="error-message" role="alert">{error}</p>}

              <button
                className="analyze-button"
                type="submit"
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? (
                  <><span className="spinner" /> Analyzing image...</>
                ) : (
                  <>Analyze image <Icon name="arrow" size={18} /></>
                )}
              </button>
            </form>

            <div className="privacy-note">
              <Icon name="shield" size={16} />
              <span>Image sent to your local API for inference. Not stored by this interface.</span>
            </div>
          </section>

          <section className={`panel results-panel ${result ? 'results-ready' : ''}`} aria-labelledby="results-heading" aria-live="polite">
            <div className="panel-heading">
              <div>
                <span className="step-label">02 / OUTPUT</span>
                <h2 id="results-heading">Model output</h2>
              </div>
              {result && <span className="result-badge"><Icon name="check" size={14} /> COMPLETE</span>}
            </div>

            {result ? (
              <div className="result-content">
                <p className="result-caption">TOP PREDICTION</p>
                <div className="prediction-name">{result.predicted_class}</div>
                <div className="confidence-row">
                  <span>Model score</span>
                  <strong>{(topScore * 100).toFixed(1)}%</strong>
                </div>
                <div className="score-track" aria-label={`Top score ${(topScore * 100).toFixed(1)} percent`}>
                  <span style={{ width: `${Math.max(0, Math.min(topScore * 100, 100))}%` }} />
                </div>

                <div className="all-scores">
                  <h3>All class scores <span>{result.scores.length} classes</span></h3>
                  {result.scores.map((score) => (
                    <div className="score-row" key={score.class}>
                      <span>{score.class}</span>
                      <div className="mini-track">
                        <span style={{ width: `${Math.max(0, Math.min(score.score * 100, 100))}%` }} />
                      </div>
                      <strong>{(score.score * 100).toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>

                <p className="result-notice">
                  <Icon name="shield" size={16} />
                  {result.notice || 'Research output only. Not validated for medical diagnosis.'}
                </p>
              </div>
            ) : (
              <div className="empty-results">
                <span className="empty-icon"><Icon name="image" size={25} /></span>
                <strong>Your results will appear here</strong>
                <span>Choose an image and run classification to inspect the model output.</span>
              </div>
            )}
          </section>
        </div>

        <section className="how-it-works" aria-label="Testing details">
          <div className="how-icon"><Icon name="refresh" size={19} /></div>
          <div>
            <strong>Local model testing</strong>
            <p>Requests are sent to <code>{API_URL}</code> · POST <code>/predict</code></p>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={async () => {
              setApiStatus('checking')
              try {
                const response = await fetch(`${API_URL}/health`)
                if (!response.ok) throw new Error(`Backend returned ${response.status}`)
                const health = await response.json()
                setApiStatus(health.status === 'ok' ? 'online' : 'offline')
              } catch {
                setApiStatus('offline')
              }
            }}
            aria-label="Check API connection"
            title="Check API connection"
          >
            <Icon name="refresh" size={17} />
          </button>
        </section>
      </main>

      <footer>
        <span>DERMALAB <span className="footer-separator">/</span> MODEL TESTER</span>
        <span>Research use only · Not a medical device</span>
      </footer>
    </div>
  )
}

export default App
