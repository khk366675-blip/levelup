import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import type { ChangeEvent } from 'react'

const STORAGE_KEY = 'levelup-save'
const PRE_IMPORT_BACKUP_KEY = 'levelup-save-before-import'

interface RawPersist {
  state?: unknown
  version?: unknown
}

interface WrappedBackup {
  app?: unknown
  type?: unknown
  data?: RawPersist
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const buildBackupFileName = (now: Date = new Date()): string => {
  const y = now.getFullYear()
  const m = pad2(now.getMonth() + 1)
  const d = pad2(now.getDate())
  const hh = pad2(now.getHours())
  const mm = pad2(now.getMinutes())
  return `levelup-backup-${y}-${m}-${d}-${hh}${mm}.json`
}

const triggerDownload = (filename: string, payload: string) => {
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so Safari/iOS has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Normalize wrapper vs raw forms into the `{ state, version }` payload that Zustand persist expects. */
const extractPersistPayload = (parsed: unknown): RawPersist | null => {
  if (!parsed || typeof parsed !== 'object') return null

  // Form A: wrapper backup
  const maybeWrapper = parsed as WrappedBackup
  if (
    maybeWrapper.type === 'levelup-save-backup' &&
    maybeWrapper.data &&
    typeof maybeWrapper.data === 'object'
  ) {
    return maybeWrapper.data
  }

  // Form B: raw Zustand persist
  const maybeRaw = parsed as RawPersist
  if (maybeRaw.state && typeof maybeRaw.state === 'object') {
    return maybeRaw
  }

  return null
}

const validatePersistPayload = (payload: RawPersist): string | null => {
  if (!payload.state || typeof payload.state !== 'object') {
    return '백업 파일에 state 객체가 없습니다.'
  }
  if (payload.version !== undefined && typeof payload.version !== 'number') {
    return '백업 파일의 version 값이 숫자가 아닙니다.'
  }
  const state = payload.state as Record<string, unknown>
  if (state.hunter === undefined && state.quests === undefined) {
    return '백업 파일에 필수 필드(hunter / quests)가 없습니다.'
  }
  return null
}

export function BackupControls() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        alert('저장된 데이터가 없어 백업할 내용이 없습니다.')
        return
      }
      let parsedSave: unknown
      try {
        parsedSave = JSON.parse(raw)
      } catch (err) {
        console.error('[BackupControls] saved data is not valid JSON', err)
        alert('저장 데이터가 손상되어 있어 백업할 수 없습니다.')
        return
      }

      const wrapped = {
        app: 'LEVEL_UP',
        type: 'levelup-save-backup',
        exportedAt: new Date().toISOString(),
        storageKey: STORAGE_KEY,
        data: parsedSave,
      }
      triggerDownload(buildBackupFileName(), JSON.stringify(wrapped, null, 2))
    } catch (err) {
      console.error('[BackupControls] export failed', err)
      alert('백업 중 예상치 못한 오류가 발생했습니다. 콘솔을 확인해주세요.')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset value so the same file can be selected again later.
    e.target.value = ''
    if (!file) return

    let text: string
    try {
      text = await file.text()
    } catch (err) {
      console.error('[BackupControls] file read failed', err)
      alert('파일을 읽는 중 오류가 발생했습니다.')
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      console.error('[BackupControls] invalid JSON', err)
      alert('파일이 올바른 JSON 형식이 아닙니다.')
      return
    }

    const payload = extractPersistPayload(parsed)
    if (!payload) {
      alert('지원하지 않는 백업 파일 형식입니다. (wrapper 또는 raw Zustand persist 형식만 허용)')
      return
    }

    const validationError = validatePersistPayload(payload)
    if (validationError) {
      alert(validationError)
      return
    }

    if (
      !window.confirm(
        '현재 진행도가 백업 파일 내용으로 덮어써집니다.\n' +
        '복원 직전 상태는 localStorage["levelup-save-before-import"]에 자동 보관됩니다.\n\n' +
        '계속할까요?',
      )
    ) {
      return
    }

    // Snapshot current state as safety net (recoverable via DevTools).
    try {
      const current = localStorage.getItem(STORAGE_KEY)
      if (current) localStorage.setItem(PRE_IMPORT_BACKUP_KEY, current)
    } catch (err) {
      console.warn('[BackupControls] pre-import snapshot failed (non-fatal)', err)
    }

    // Write new persist payload + reload to rehydrate Zustand store.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (err) {
      console.error('[BackupControls] write failed', err)
      alert('저장 공간 부족 등으로 데이터를 쓰지 못했습니다. 기존 데이터는 그대로 유지됩니다.')
      return
    }

    window.location.reload()
  }

  return (
    <>
      <button
        onClick={handleExport}
        className="btn btn-ghost text-xs"
        title="현재 저장 데이터를 JSON 파일로 내려받습니다"
      >
        <Download className="w-3.5 h-3.5" /> 저장 백업
      </button>
      <button
        onClick={handleImportClick}
        className="btn btn-ghost text-xs text-cyan-200/80 hover:text-cyan-100"
        title="JSON 백업 파일에서 데이터를 복원합니다 (현재 진행도 덮어쓰기)"
      >
        <Upload className="w-3.5 h-3.5" /> 저장 불러오기
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  )
}
