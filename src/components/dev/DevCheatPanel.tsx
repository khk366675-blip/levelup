import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Wand2,
  RotateCcw,
  Trash2,
  Save,
  Flame,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useGame } from '../../lib/store'
import {
  DEV_CHEAT_BACKUP_KEY,
  backupDevCheatSave,
  restoreDevCheatSave,
  clearDevCheatBackup,
  applyDevCheatProfile
} from '../../lib/devCheats'

export function DevCheatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBackup, setHasBackup] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  // DEV 전용 UI 가드
  if (!import.meta.env.DEV) return null

  // 백업 존재 여부 주기적/마운트 시 확인
  const checkBackupStatus = () => {
    if (typeof window !== 'undefined') {
      setHasBackup(Boolean(window.localStorage.getItem(DEV_CHEAT_BACKUP_KEY)))
    }
  }

  useEffect(() => {
    checkBackupStatus()
  }, [])

  const handleManualBackup = () => {
    const currentState = useGame.getState()
    const success = backupDevCheatSave(currentState)
    if (success) {
      checkBackupStatus()
      setLastAction(`현재 저장 상태가 성공적으로 백업되었습니다.`)
      alert('백업 완료! (key: levelup-save-dev-cheat-backup)')
    } else {
      alert('백업 실패!')
    }
  }

  const handleApplyCheat = (profileId: 'monarchTestReady' | 'angelTestReady', label: string) => {
    const confirmation = window.confirm(
      `⚠️ [DEV CHEAT] ${label}을(를) 적용하시겠습니까?\n\n` +
      `- 기존 세이브는 '${DEV_CHEAT_BACKUP_KEY}'에 백업됩니다.\n` +
      `- 플레이어 스탯이 고레벨로 강제 변경되고, 5성 legendary 전설 장비 세트가 장착되며, S급 군주급 그림자 군단 22명이 자동 주입/출전합니다.\n` +
      `- 월드맵 정화 전선 노드들이 강제로 설정됩니다.\n\n` +
      `계속 진행하시겠습니까?`
    )
    if (!confirmation) return

    try {
      useGame.setState((state) => applyDevCheatProfile(profileId, state))
      checkBackupStatus()
      setLastAction(`${label} 프로필이 정상 적용되었습니다! (${new Date().toLocaleTimeString()})`)
      alert(`${label} 적용 완료! 인벤토리/군단 탭과 월드맵을 확인하십시오.`)
    } catch (error) {
      console.error(error)
      alert('치트 주입 중 오류가 발생했습니다. 세이브 상태를 확인하십시오.')
    }
  }

  const handleRestore = () => {
    const confirmation = window.confirm(
      `🔄 백업에서 원래 세이브 상태를 복원하시겠습니까?\n\n` +
      `- 복원 완료 후 원래 상태를 불러오기 위해 페이지가 자동으로 새로고침됩니다.\n\n` +
      `계속 진행하시겠습니까?`
    )
    if (!confirmation) return

    const success = restoreDevCheatSave()
    if (!success) {
      alert('복원에 실패했습니다. 백업 데이터가 존재하는지 확인하십시오.')
    }
  }

  const handleClearBackup = () => {
    const confirmation = window.confirm(
      `🗑️ '${DEV_CHEAT_BACKUP_KEY}' 백업 데이터를 정말로 삭제하시겠습니까?\n` +
      `이 작업은 취소할 수 없습니다.`
    )
    if (!confirmation) return

    const success = clearDevCheatBackup()
    if (success) {
      checkBackupStatus()
      setLastAction('백업 데이터가 로컬 스토리지에서 완벽히 삭제되었습니다.')
      alert('백업 데이터 삭제 완료!')
    } else {
      alert('백업 삭제 실패!')
    }
  }

  return (
    <section className="panel corner-bracket overflow-hidden border-rose-500/35 bg-rose-500/5 p-3.5 shadow-[0_0_16px_rgba(239,68,68,0.05)]">
      <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
      
      {/* 아코디언 헤더 */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-300 system-text animate-pulse">
            <ShieldAlert className="h-3 w-3" />
            DEV_CHEAT
          </span>
          <h3 className="text-sm font-bold text-rose-200 tracking-wider">
            검증용 임시 치트 모드
          </h3>
          <span className="text-[10.5px] text-white/40 font-mono">
            {hasBackup ? '● 백업 있음' : '○ 백업 없음'}
          </span>
        </div>
        <button type="button" className="text-rose-300 hover:text-rose-100 transition-colors">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* 치트 내용 바디 */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-rose-500/20 space-y-3 animate-fade-in">
          <div className="space-y-1">
            <p className="text-[11px] leading-relaxed text-white/60">
              Living Rift World 군주(Monarch) 및 천사(Angel) 최종전을 즉각 검증하기 위한 임시 치트 모드 패널입니다.
            </p>
            <div className="flex items-start gap-1 rounded bg-rose-500/10 p-2 text-[10.5px] text-rose-200/90 leading-relaxed border border-rose-500/20">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong>[주의!]</strong> 이 기능은 임시 검증 목적이며 Production 빌드에서는 원천 비노출됩니다.<br/>
                검증 후 반드시 <strong className="text-white">"백업에서 복원"</strong>을 클릭하여 원래 세이브 데이터로 롤백해 주십시오.
              </div>
            </div>
            {lastAction && (
              <div className="text-[10px] text-emerald-300 font-medium py-0.5">
                📣 {lastAction}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {/* 1. 세이브 백업 버튼 */}
            <button
              type="button"
              onClick={handleManualBackup}
              className="btn btn-secondary text-xs flex items-center gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
              title="현재 세이브 데이터를 임시 복원용 백업 키에 강제 저장합니다."
            >
              <Save className="h-3.5 w-3.5" />
              현재 세이브 백업
            </button>

            {/* 2. 군주전 검증 프로필 적용 */}
            <button
              type="button"
              onClick={() => handleApplyCheat('monarchTestReady', 'Monarch Test Ready')}
              className="btn btn-primary text-xs flex items-center gap-1.5 border-rose-500/50 bg-rose-500/20 text-rose-100 hover:bg-rose-500/40 hover:text-white"
              title="군주 8명 습격 상태와 Lv.100의 헌터, 최고 티어 군단과 장비를 주입합니다."
            >
              <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              Monarch Test Ready 적용
            </button>

            {/* 3. 천사/최종전 검증 프로필 적용 */}
            <button
              type="button"
              onClick={() => handleApplyCheat('angelTestReady', 'Angel Test Ready')}
              className="btn btn-primary text-xs flex items-center gap-1.5 border-purple-500/50 bg-purple-500/20 text-purple-100 hover:bg-purple-500/40 hover:text-white"
              title="8군주 격퇴 완료 상태와 지고의 심판자(천사) 최종 보스 노드를 즉시 개방하고, 강력한 캐릭터 스펙을 주입합니다."
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Angel Test Ready 적용
            </button>

            {/* 4. 백업 복원 버튼 */}
            {hasBackup && (
              <button
                type="button"
                onClick={handleRestore}
                className="btn btn-ghost text-xs flex items-center gap-1.5 border-cyan-500/30 bg-cyan-950/20 text-cyan-200 hover:bg-cyan-950/40 hover:text-white"
                title="임시 백업 세이브로부터 이전의 원래 상태로 돌려놓고 페이지를 새로고침합니다."
              >
                <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                백업에서 복원
              </button>
            )}

            {/* 5. 백업 데이터 삭제 버튼 */}
            {hasBackup && (
              <button
                type="button"
                onClick={handleClearBackup}
                className="btn btn-ghost text-xs flex items-center gap-1.5 border-rose-500/20 bg-rose-950/10 text-rose-300 hover:bg-rose-950/30 hover:text-rose-100"
                title="임시 백업 키에 저장된 로컬스토리지를 영구 삭제합니다."
              >
                <Trash2 className="h-3.5 w-3.5" />
                치트 백업 삭제
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
