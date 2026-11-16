import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import type { Settings } from '../services/storage';
import type { GameOptions } from './GameOptions';
export function createGame(parent: HTMLElement, settings: Settings | undefined, options: GameOptions) {
  // Native Gamepad API is polled by GameScene; keep Phaser's second poller off.
  return new Phaser.Game({ type: Phaser.AUTO, parent, input: { gamepad: false, keyboard: { target: options.inputTarget ?? parent } }, backgroundColor: '#223b32', pixelArt: true, roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight }, scene: [new GameScene(settings, options)], banner: false });
}
