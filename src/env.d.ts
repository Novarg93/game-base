import type { World } from './game/systems/World';
import type { Metrics } from './game/events/bridge';
import type { GameArt } from './game/art/GameArt';
import type { CharacterId } from './game/config/characters';
declare global {
  interface Window { __GAME_BASE_DEMO__?: { unmount: () => Promise<import('./game/events/bridge').GameBridge>; mount: () => Promise<void>; bridge: () => import('./game/events/bridge').GameBridge }; __PIXEL__?: { world: World; finalScenario: (action: import('./game/bootstrap/finalBossScenario').FinalScenario) => void; setVisualTime: (seconds?: number) => void; setTestCharacter: (character: CharacterId) => void; listeners: () => { commands: number; snapshots: number; metrics: number }; metrics: () => Metrics; restartScene: () => void; art: () => ReturnType<GameArt['diagnostics']> | undefined; presentation: () => { renderer: string; textures: string[] }; atmosphere: () => ReturnType<import('./game/art/ForestAtmosphere').ForestAtmosphere['diagnostics']> | undefined; audio: () => ReturnType<import('./game/audio/AudioController').AudioController['diagnostics']> } }
}
