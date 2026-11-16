import type { GameDefinition } from '../config/gameDefinition';
import type { GameBridge } from '../events/bridge';
import type { VisualMode } from '../art/themes/types';
export interface GameOptions { definition: GameDefinition; bridge: GameBridge; visualMode: VisualMode; assetBaseUrl: string; developmentTools?: boolean; inputTarget?: HTMLElement }
