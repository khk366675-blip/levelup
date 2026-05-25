

## 전투 턴수 제한 제거 패치 — 게이트/무한의 탑 전투가 7턴 전후에서 중단되고 패배 처리되는 문제 수정 (2026-05-25)
- **Direct Battle 턴수 제한 제거 및 Hard Safety 도입**: directBattleRuntime.ts 내에서 `state.round >= state.maxRounds` 조건으로 인해 전투가 강제 종료되는 부분을 제거하고, 무한 루프 방지용 `HARD_SAFETY_ROUND_LIMIT = 200`을 도입하여 200턴 도달 시 'safety_abort' 및 무승부(none) 상태로 중단하도록 수정.
- **Direct Battle Outcome 판정 수정**: DirectBattlePreviewPanel.tsx의 `getPanelOutcome`에서 winner가 player면 victory, enemy면 defeat, 그 외(stalemate/none)의 경우는 cancelled로 맵핑하여 강제 패배로 기록되지 않도록 수정.
- **Auto/Manual Battle Simulator 턴 제한 상향**: game.ts 내의 `simulateGateBattle` 및 `simulateGateWaveBattle`에서 maxTurns 기본값을 30에서 200으로 크게 늘려 일반 전투에서는 턴 제한 초과로 인한 무승부(draw)가 발생하지 않도록 조치.
- **Game State Store 및 Manual Battle config 수정**: resolveDirectGateBattle 및 resolveDirectTowerBattle에서 draw/cancelled 결과가 패배(defeat)로 변환되지 않고 무승부/시간초과로 올바르게 기록되도록 결과 맵핑 수정. 수동 전투 시작(startManualGateBattle, startTowerManualBattle) 시에도 maxTurns 설정을 30에서 200으로 증가.
- **기존 데이터 보존**: persist v14 및 levelup-save key 유지.
