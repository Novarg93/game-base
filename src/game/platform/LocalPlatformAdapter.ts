import { defaultGameDefinition, type GameDefinition } from '../config/gameDefinition';
import { browserStorage, loadProfile, saveProfile, withRun, type StoragePort, type Settings, type RunRecord } from '../services/storage';
import type { GamePlatformAdapter, PlatformRun, StartRunRequest, RunStatistics } from './GamePlatformAdapter';
export class LocalPlatformAdapter implements GamePlatformAdapter {
  private active = new Map<string, PlatformRun>();
  private profile;
  private readonly key: string;
  private readonly storage: StoragePort | undefined;
  constructor(private definition: GameDefinition = defaultGameDefinition, storage?: StoragePort) {
    this.storage = storage ?? browserStorage(); this.key = `game-base:${definition.id}:v1`;
    this.profile = loadProfile(this.storage, this.key);
  }
  async getPlayerIdentity() { return { id: 'local', name: 'Local player', kind: 'guest' as const }; }
  async getGameConfiguration() { return this.definition; }
  async startRun(request: StartRunRequest) {
    if (request.gameId !== this.definition.id || !this.definition.heroes[request.heroId] || !this.definition.maps[request.mapId]) throw new Error('Invalid run request');
    const existing = this.active.get(request.clientRunId); if (existing) return existing;
    const run = { id: request.clientRunId, clientRunId: request.clientRunId, startedAt: new Date().toISOString() };
    this.active.clear(); this.active.set(request.clientRunId, run); return run;
  }
  async finishRun(run: PlatformRun, result: RunRecord) {
    if (run.clientRunId !== result.id) throw new Error('Run result ID mismatch');
    const previous = this.profile; this.profile = withRun(this.profile, result);
    this.active.delete(run.clientRunId);
    if (this.profile !== previous && !saveProfile(this.profile, this.storage, this.key)) throw new Error('Local storage unavailable; result kept in memory');
  }
  async submitRunStatistics(run: PlatformRun, statistics: RunStatistics) {
    if (!run.id || !Object.values(statistics).every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid run statistics');
    // Local records already include these statistics; no second increment.
  }
  async loadProfile() { return structuredClone(this.profile); }
  async saveSettings(settings: Settings) {
    this.profile = { ...this.profile, settings: { ...settings } };
    if (!saveProfile(this.profile, this.storage, this.key)) throw new Error('Local storage unavailable; settings kept in memory');
  }
  async loadInventory() { return []; }
  async requestPremiumAction(action: string) { return { supported: false as const, reason: `${action}: premium actions are not implemented in Game Base v1` }; }
  async getLeaderboard() { return { scope: 'local' as const, entries: this.profile.records.map(r => ({ id: r.id, name: 'Local player', score: r.score })) }; }
}
