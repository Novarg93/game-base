
export class Channel<T> {
  private listeners = new Set<(value: T) => void>();
  on(listener: (value: T) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  emit(value: T) { for (const listener of this.listeners) listener(value); }
  clear() { this.listeners.clear(); }
  get size() { return this.listeners.size; }
}


import type { PracticeBoss } from '../config/bossPractice';
import type { Snapshot } from '../systems/World';
import type { RadarFrame } from '../radar/radar';
import type { Settings } from '../services/storage';
import type { Point } from '../utils/math';
import type { GamepadNotice } from '../input/GamepadInputController';
export type InputDevice = 'keyboard' | 'touch' | 'gamepad';
export type UiScreen = 'game' | 'settings' | 'help' | 'records';
export type GamepadUiAction = 'confirm' | 'up' | 'down' | 'left' | 'right' | 'previous' | 'next';
export type Command = { type: 'restart' | 'boss-practice' | 'menu' | 'pause' | 'resume' | 'preview'; character?: string; biome?: string; practiceBoss?: PracticeBoss } | { type: 'mobility' | 'ultimate' } | { type: 'upgrade'; id: string; offer: number } | { type: 'settings'; value: Settings } | { type: 'move'; input: Point } | { type: 'ui-screen'; screen: UiScreen };
export interface Metrics { fps: number; updateMs: number; enemies: number; projectiles: number; orbs: number; effects: number; bosses: number; chunks: number; sprites: number; pooledSprites: number; guardians: number; artifacts: { items: number; allocated: number }; radar: { updates: number; markers: number; listeners: number }; loot: { items: number; chests: number; buffs: number; trail: number; allocatedItems: number; allocatedChests: number }; allocations: { projectiles: number; orbs: number; effects: number } }

export function createGameBridge() {
  const gamepadUi = new Channel<{ scope: 'upgrade' | 'shell'; action: GamepadUiAction }>();
  const inputDevices = new Channel<InputDevice>();
  const gamepadNotices = new Channel<GamepadNotice>();
  const snapshots = new Channel<Snapshot>();
  const radarFrames = new Channel<RadarFrame | null>();
  const commands = new Channel<Command>();
  const metrics = new Channel<Metrics>();
  const channels = { gamepadUi, inputDevices, gamepadNotices, snapshots, radarFrames, commands, metrics };
  return { ...channels, dispose() { for (const channel of Object.values(channels)) channel.clear(); } };
}
export type GameBridge = ReturnType<typeof createGameBridge>;
export const defaultBridge = createGameBridge();
export const { gamepadUi, inputDevices, gamepadNotices, snapshots, radarFrames, commands, metrics } = defaultBridge;
