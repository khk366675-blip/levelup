import type { Item } from './types'

export function sanitizeRetiredTowerText(text?: string): string {
  if (!text) return ''

  return text
    .replace(/무한의 탑\s*\d+층\s*보스 박스/g, '보스 전리품 상자')
    .replace(/무한의 탑\s*\d+층/g, '상위 전투 기록')
    .replace(/무한의 탑/g, '상위 전투')
    .replace(/탑 등반 장갑/g, '돌파 장갑')
    .replace(/탑 입문 배지/g, '도전 입문 배지')
    .replace(/탑의 방벽 외투/g, '방벽 외투')
    .replace(/보스층 견갑/g, '보스전 견갑')
    .replace(/탑 보스층/g, '상위 보스전')
    .replace(/보스층/g, '보스전')
    .replace(/탑과 게이트/g, '게이트와 보급 신호')
    .replace(/게이트, 탑, 그림자 소환/g, '게이트, 보급, 그림자 소환')
    .replace(/층을 오를수록/g, '전투가 길어질수록')
    .replace(/첫 계단을 밟은/g, '첫 도전 기록을 남긴')
}

export const getItemDisplayName = (item: Item): string => sanitizeRetiredTowerText(item.name)

export const getItemDisplayDescription = (item: Item): string => sanitizeRetiredTowerText(item.description)
