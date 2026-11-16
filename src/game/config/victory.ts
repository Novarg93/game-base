export type VictoryCondition = { type: 'final-boss' } | { type: 'survive' } | { type: 'kills'; target: number } | { type: 'endless' };
export const victory: VictoryCondition = { type: 'final-boss' };
