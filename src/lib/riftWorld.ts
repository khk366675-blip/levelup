import type { RiftNode, RiftNodeStatus } from './types'
import { RIFT_NODES } from './seed'

/**
 * 특정 국가(Region)의 클리어 진행도(cleared 노드 개수 / 전체 노드 개수)를 계산합니다.
 */
export function getRegionProgress(
  regionId: string,
  riftNodesState: Record<string, RiftNodeStatus>
): { cleared: number; total: number; percent: number } {
  const regionNodes = RIFT_NODES.filter((n) => n.regionId === regionId)
  if (regionNodes.length === 0) {
    return { cleared: 0, total: 0, percent: 0 }
  }

  const cleared = regionNodes.filter(
    (n) => (riftNodesState[n.id] ?? n.status) === 'cleared'
  ).length

  return {
    cleared,
    total: regionNodes.length,
    percent: parseFloat(((cleared / regionNodes.length) * 100).toFixed(1)),
  }
}

/**
 * 잠겨있는 노드(locked)가 해금 가능한 상태(requiresNodeIds가 모두 cleared)인지 판정합니다.
 */
export function isNodeUnlockable(
  node: RiftNode,
  riftNodesState: Record<string, RiftNodeStatus>
): boolean {
  if (!node.requiresNodeIds || node.requiresNodeIds.length === 0) {
    return true
  }

  return node.requiresNodeIds.every(
    (reqId) => (riftNodesState[reqId] ?? 'undiscovered') === 'cleared'
  )
}

/**
 * 노드 상태별 표시 컬러 클래스들을 반환합니다 (Tailwind CSS 기반).
 */
export const RIFT_NODE_STATUS_META: Record<
  RiftNodeStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  undiscovered: {
    label: '미탐사',
    bgClass: 'bg-zinc-950/80',
    textClass: 'text-zinc-500',
    borderClass: 'border-zinc-800/40',
  },
  locked: {
    label: '잠김',
    bgClass: 'bg-ink-950/80',
    textClass: 'text-zinc-600',
    borderClass: 'border-zinc-900/50',
  },
  active: {
    label: '활성',
    bgClass: 'bg-cyan-950/40 shadow-glow-cyan/10',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-500/50 animate-pulse',
  },
  cleared: {
    label: '정화 완료',
    bgClass: 'bg-emerald-950/40',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/40',
  },
}
