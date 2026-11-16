import { progression } from '../config/progression';
export function xpThreshold(level: number, config = progression) { return Math.min(config.xpCap, Math.floor(config.xpBase * config.xpGrowth ** Math.min(config.xpExponentCap, Math.max(0, level - 1)))); }
export class ExperienceSystem {
  constructor(private config = progression) {}
  level = 1; xp = 0; pending = 0;
  gain(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0 || this.level>=this.config.maxLevel) return;
    this.xp = Math.round((this.xp + Math.min(100000, amount)) * 100) / 100;
    while (this.level<this.config.maxLevel && this.xp >= xpThreshold(this.level, this.config)) { this.xp -= xpThreshold(this.level, this.config); this.level++; this.pending++; }
    if(this.level===this.config.maxLevel)this.xp=0;
  }
}
