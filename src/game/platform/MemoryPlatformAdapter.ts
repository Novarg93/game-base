import { LocalPlatformAdapter } from './LocalPlatformAdapter';
import { defaultGameDefinition, type GameDefinition } from '../config/gameDefinition';
import type { StoragePort } from '../services/storage';
export class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}
export class MemoryPlatformAdapter extends LocalPlatformAdapter {
  constructor(definition: GameDefinition = defaultGameDefinition) { super(definition, new MemoryStorage()); }
}
