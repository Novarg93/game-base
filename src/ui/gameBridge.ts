import { inject, type InjectionKey } from 'vue';
import { defaultBridge, type GameBridge } from '../game/events/bridge';
export const GAME_BRIDGE: InjectionKey<GameBridge> = Symbol('game-base-bridge');
export function useGameBridge() { return inject(GAME_BRIDGE, defaultBridge); }
