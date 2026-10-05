import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, FileWarning } from 'lucide-react'
import clsx from 'clsx'
import LoadingSpinner from '../common/LoadingSpinner'
import ImageScanResult from './ImageScanResult'
import { useScanResult } from '../../hooks/useScanResult'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
const MAX_SIZE_MB = 10

function DropZone({ isDragging }) {
  return (
    <div className={clsx(
      'border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center gap-3 cursor-pointer',
      isDragging
        ? 'border-brand-400 bg-brand-500/5'
        : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
    )}>
      <div className={clsx(
        'w-12 h-12 rounded-full flex items-center justify-center',
        isDragging ? 'bg-brand-500/20' : 'bg-slate-800'
      )}>
        <Upload className={clsx('w-6 h-6', isDragging ? 'text-brand-400' : 'text-slate-500')} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">
          {isDragging ? 'Drop image here' : 'Drop image or click to upload'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          JPEG, PNG, WebP, GIF, BMP · Max {MAX_SIZE_MB}MB
        </p>
      </div>
      <p className="text-xs text-slate-600 max-w-xs">
        Supports: screenshots, WhatsApp forwards, government documents, photos, memes
      </p>
    </div>
  )
}

function ImagePreview({ file, preview, onRemove }) {
  const sizeMB = (file.size / 1024 / 1024).toFixed(2)
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
      <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-slate-950" />
      <div className="absolute top-2 right-2">
        <button
          aria-label="Remove image"
          onClick={onRemove}
          className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400 truncate max-w-xs">{file.name}</span>
        </div>
        <span className="text-xs text-slate-500">{sizeMB} MB</span>
      </div>
    </div>
  )
}

export default function ImageTab() {
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const [fileError, setFileError] = useState(null)
  const inputRef = useRef(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const { result, loading, error, scan, reset } = useScanResult()

  const validateAndSet = useCallback((f) => {
    setFileError(null)
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError(`Unsupported file type: ${f.type}. Use JPEG, PNG, WebP, GIF or BMP.`)
      return
    }
    if (!f.size) { setFileError('The file is empty.'); return }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File too large: ${(f.size / 1024 / 1024).toFixed(1)}MB. Max ${MAX_SIZE_MB}MB.`)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    reset()
  }, [reset])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSet(dropped)
  }, [validateAndSet])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleFileInput = (e) => {
    const selected = e.target.files[0]
    if (selected) validateAndSet(selected)
    e.target.value = ''
  }

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setFileError(null)
    reset()
  }

  const handleScan = () => {
    if (!file || loading) return
    scan('image', file)
  }

  if (result) {
    return <ImageScanResult result={result} onReset={() => { reset(); handleRemove() }} />
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-1.5">
        <p className="text-xs font-medium text-slate-300">What this checks:</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            '🤖 Optional AI model signals',
            '✂️ Image manipulation heuristics',
            '🚨 Scam message screenshots',
            '📄 Document structure and edit signals',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">{item}</span>
            </div>
          ))}
        </div>
      </div>
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <DropZone isDragging={dragging} />
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      ) : (
        <ImagePreview file={file} preview={preview} onRemove={handleRemove} />
      )}
      {fileError && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <FileWarning className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{fileError}</p>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      <p className="text-[11px] text-slate-600 text-center">
        🔒 Images are analyzed and immediately discarded. We never store your uploads.
      </p>
      {loading ? (
        <LoadingSpinner label="Analysing image... this may take 10–20 seconds" />
      ) : (
        <button
          onClick={handleScan}
          disabled={!file || !!fileError || loading}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            file && !fileError ? 'bg-brand-500 hover:bg-brand-400 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Analyse Image
        </button>
      )}
    </div>
  )
}
