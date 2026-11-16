import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import original from '../fixtures/original-gameplay.json';
import { simulationBaseline } from '../helpers/simulationBaseline';
it.each(['mage','warrior'] as const)('preserves %s simulation against the original migrated commit', character => {
  expect(simulationBaseline(World,character)).toEqual(original.baseline.find(b=>b.character===character));
});
