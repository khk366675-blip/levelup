import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, RotateCcw, Skull, Calendar, Trophy, Swords, Flame, FileJson } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { HallOfFameRecord } from '../lib/types'

interface HallOfFameModalProps {
  open: boolean
  onClose: () => void
}

const getDeathDescription = (reason: string, context: string) => {
  switch (reason) {
    case 'player_death':
      return `일반 게이트 [${context}] 공략 중 치명상을 입고 쓰러짐`
    case 'gate_echo_player_death':
      return `차원의 반향 [${context}] 에코 게이트 전투 중 메아리 속에 영원히 소멸함`
    case 'monarch_player_death':
      return `군주 [${context}] 와의 결전 중 장렬하게 전사하여 세계의 주춧돌이 됨`
    default:
      return `[${context}] 전투 중 알 수 없는 차원의 간섭으로 사망 (${reason})`
  }
}

export function HallOfFameModal({ open, onClose }: HallOfFameModalProps) {
  const [records, setRecords] = useState<HallOfFameRecord[]>([])

  // Load records whenever modal opens
  useEffect(() => {
    if (open) {
      try {
        const recordsRaw = localStorage.getItem('levelup-hall-of-fame')
        const parsed: HallOfFameRecord[] = recordsRaw ? JSON.parse(recordsRaw) : []
        // Sort descending just in case (already unshifted in store, but good safeguard)
        parsed.sort((a, b) => b.generation - a.generation)
        setRecords(parsed)
      } catch (err) {
        console.error('[HallOfFameModal] Failed to load records', err)
      }
    }
  }, [open])

  const handleDownloadBackup = (record: HallOfFameRecord) => {
    try {
      const backupRaw = localStorage.getItem(record.backupKey)
      if (!backupRaw) {
        alert('백업 데이터가 보관 기간 만료(최근 5대만 백업본 유지)로 인해 삭제되었습니다.')
        return
      }

      const parsedBackup = JSON.parse(backupRaw)
      if (!parsedBackup || !parsedBackup.state) {
        alert('백업 데이터가 손상되어 내려받을 수 없습니다.')
        return
      }

      const wrapped = {
        app: 'LEVEL_UP',
        type: 'levelup-save-backup',
        exportedAt: new Date(record.timestamp).toISOString(),
        storageKey: 'levelup-save',
        data: {
          state: parsedBackup.state,
          version: 30, // matches store.ts version
        },
      }

      const filename = `levelup-hardcore-gen-${record.generation}-backup.json`
      const blob = new Blob([JSON.stringify(wrapped, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('[HallOfFameModal] Export failed', err)
      alert('백업 파일을 생성하는 데 실패했습니다.')
    }
  }

  const handleRestoreBackup = (record: HallOfFameRecord) => {
    try {
      const backupRaw = localStorage.getItem(record.backupKey)
      if (!backupRaw) {
        alert('백업 데이터가 보관 기간 만료(최근 5대만 백업본 유지)로 인해 삭제되었습니다.')
        return
      }

      const parsedBackup = JSON.parse(backupRaw)
      if (!parsedBackup || !parsedBackup.state) {
        alert('백업 데이터가 손상되어 불러올 수 없습니다.')
        return
      }

      if (
        !window.confirm(
          `정말로 제 ${record.generation}대 헌터의 세계선으로 진행도를 복원하시겠습니까?\n` +
            `현재 진행 중인 헌터의 모든 상태는 이 백업 내용으로 덮어씌워집니다.\n\n` +
            `복원 직전 상태는 localStorage["levelup-save-before-import"]에 자동으로 안전 보관됩니다.`
        )
      ) {
        return
      }

      // Safeguard current state
      try {
        const current = localStorage.getItem('levelup-save')
        if (current) {
          localStorage.setItem('levelup-save-before-import', current)
        }
      } catch (err) {
        console.warn('[HallOfFameModal] Pre-import snapshot failed', err)
      }

      // Set state to levelup-save
      const payload = {
        state: parsedBackup.state,
        version: 30, // matches store.ts version
      }

      localStorage.setItem('levelup-save', JSON.stringify(payload))
      window.location.reload()
    } catch (err) {
      console.error('[HallOfFameModal] Restore failed', err)
      alert('진행도 복원에 실패했습니다.')
    }
  }

  const checkBackupExists = (key: string): boolean => {
    if (typeof localStorage === 'undefined') return false
    return !!localStorage.getItem(key)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="panel panel-glow corner-bracket w-full max-w-2xl bg-ink-950/98 border-amber-500/25 p-6 relative z-10 flex flex-col max-h-[85vh] overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)]"
          >
            {/* Corner Brackets */}
            <div className="br" /> <div className="tl" /> <div className="tr" /> <div className="bl" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                  <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-amber-100 tracking-wider system-text">
                    🕯️ 명예의 전당 (HALL OF FAME)
                  </h2>
                  <p className="text-[10px] text-amber-400/50 mt-0.5 uppercase tracking-widest font-mono">
                    Chronicle of the Fallen Hunter Legacies
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition p-1.5 hover:bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              
              {/* Introduction Text */}
              <div className="bg-amber-950/10 border border-amber-500/15 rounded-lg p-4 text-center space-y-1">
                <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                  "죽음은 끝이 아니요, 새로운 세계선을 위한 숭고한 주춧돌이니."
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  이곳은 하드코어 전투에서 산화한 선대 헌터들의 숭고한 역사와 발자취를 기리는 묘비석입니다.
                  능력치나 재화는 계승되지 않으나, 그들이 도달했던 정점의 세이브 데이터가 영원히 보존됩니다.
                </p>
              </div>

              {/* Records List */}
              <div className="space-y-4">
                {records.length === 0 ? (
                  <div className="panel bg-black/40 border-dashed border-zinc-800 p-12 text-center rounded-lg space-y-2">
                    <Skull className="w-8 h-8 text-zinc-600 mx-auto opacity-40" />
                    <p className="text-xs text-zinc-400 font-bold">
                      아직 명예의 전당에 새겨진 선대 헌터의 기록이 없습니다.
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      하드코어 상태에서 사망할 시, 당시의 레벨과 업적 정보가 이곳에 영구 기록됩니다.
                    </p>
                  </div>
                ) : (
                  records.map((record) => {
                    const hasBackup = checkBackupExists(record.backupKey)
                    return (
                      <div
                        key={record.generation}
                        className="relative bg-slate-950/70 border border-amber-950/60 hover:border-amber-500/20 rounded-lg p-4 transition duration-300 group shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        {/* Background Memorial Glyph/Tint */}
                        <div className="absolute right-4 bottom-2 text-zinc-900 font-mono text-7xl font-black select-none pointer-events-none opacity-20 tracking-tighter transition-opacity duration-300 group-hover:opacity-30">
                          GEN {record.generation}
                        </div>

                        {/* Record Info Left */}
                        <div className="space-y-3 flex-1 relative z-10">
                          {/* Generational Header */}
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                              제 {record.generation}대 헌터
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              Lv.{record.level} [{record.rank}급]
                            </span>
                          </div>

                          {/* Death Cause (Narrative Sentence) */}
                          <p className="text-[11px] text-red-300/90 font-medium leading-relaxed border-l-2 border-red-500/30 pl-2">
                            {getDeathDescription(record.deathReason, record.battleContext)}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-amber-500/50" />
                              <span>생존: <strong className="text-zinc-200">{record.survivalDays}일</strong></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-500/50" />
                              <span>최고 탑: <strong className="text-zinc-200">{record.highestTowerFloor}층</strong></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Swords className="w-3.5 h-3.5 text-amber-500/50" />
                              <span>게이트: <strong className="text-zinc-200">{record.gateClearedCount}회</strong></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Skull className="w-3.5 h-3.5 text-amber-500/50" />
                              <span>보스: <strong className="text-zinc-200">{record.bossKillsCount}회</strong></span>
                            </div>
                          </div>

                          {/* Defeated Monarchs */}
                          {record.monarchsDefeatedNames && record.monarchsDefeatedNames.length > 0 && (
                            <div className="text-[10px] text-zinc-400">
                              <span>토벌한 군주: </span>
                              <span className="text-amber-400 font-semibold">
                                {record.monarchsDefeatedNames.join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Time & Streak */}
                          <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                            <span>안식 시각: {new Date(record.timestamp).toLocaleString()}</span>
                            {record.streak > 0 && (
                              <span className="text-amber-500/60 font-semibold font-mono">
                                STREAK {record.streak} DAYS
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Operations Right */}
                        <div className="flex md:flex-col justify-end md:justify-start gap-2 pt-2 md:pt-0 shrink-0 relative z-10">
                          {hasBackup ? (
                            <>
                              <button
                                onClick={() => handleDownloadBackup(record)}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500/40 text-[10px] text-zinc-300 hover:text-white transition w-full md:w-28 shadow-sm"
                                title="이 시점의 세이브 데이터를 JSON으로 내보냅니다"
                              >
                                <Download className="w-3 h-3 text-amber-400" />
                                <span>백업 다운로드</span>
                              </button>
                              <button
                                onClick={() => handleRestoreBackup(record)}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/60 text-[10px] text-amber-200 hover:text-white transition w-full md:w-28 shadow-sm"
                                title="현재 진행도를 덮어쓰고 이 시점으로 되돌아갑니다"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-400 animate-spin-slow" />
                                <span>진행도 복원</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-black/40 border border-zinc-900 text-[9px] text-zinc-600 w-full md:w-28 text-center select-none font-mono">
                              <FileJson className="w-3 h-3 opacity-30" />
                              <span>BACKUP CLEANED</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

            </div>

            {/* Footer Notice */}
            <div className="border-t border-amber-500/20 pt-4 mt-4 text-center">
              <p className="text-[9px] text-amber-500/40 font-mono tracking-widest uppercase">
                ── MEMORIAL SYSTEM // THE LEGACY OF ANCESTORS SHALL REMAIN FOREVER ──
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
