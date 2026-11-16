import type { GameDefinition } from '../config/gameDefinition';
import type { Profile, RunRecord, Settings } from '../services/storage';
export interface PlayerIdentity { id: string; name: string; kind: 'guest' | 'player' }
export interface StartRunRequest { gameId: string; clientRunId: string; heroId: string; mapId: string }
export interface PlatformRun { id: string; clientRunId: string; startedAt: string }
export interface RunStatistics { kills: number; seconds: number; score: number }
export interface InventoryItem { id: string; quantity: number }
export interface LeaderboardEntry { id: string; name: string; score: number }
export type PremiumActionResult = { supported: false; reason: string }
  | { supported: true; requestId: string; status: 'granted' | 'denied'; reason?: string };
// Client snapshots/results are untrusted telemetry. No competitive/financial authority.
export interface GamePlatformAdapter {
  getPlayerIdentity(): Promise<PlayerIdentity>;
  getGameConfiguration(): Promise<GameDefinition>;
  startRun(request: StartRunRequest): Promise<PlatformRun>;
  finishRun(run: PlatformRun, result: RunRecord): Promise<void>;
  submitRunStatistics(run: PlatformRun, statistics: RunStatistics): Promise<void>;
  loadProfile(): Promise<Profile>;
  saveSettings(settings: Settings): Promise<void>;
  loadInventory(): Promise<readonly InventoryItem[]>;
  requestPremiumAction(action: string): Promise<PremiumActionResult>;
  getLeaderboard(): Promise<{ scope: 'local' | 'remote'; entries: readonly LeaderboardEntry[] }>;
}
