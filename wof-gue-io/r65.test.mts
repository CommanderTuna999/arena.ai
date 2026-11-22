import assert from 'node:assert/strict';
import { salvageSpriteScale } from './src/game/salvage-render';
assert.equal(salvageSpriteScale(100,1,1),1);
assert.equal(salvageSpriteScale(100,1,2),2);
assert.equal(salvageSpriteScale(500,1,1),null);
assert.equal(salvageSpriteScale(100,.3,2),1);
assert.equal(salvageSpriteScale(100,1,4),null);
assert.equal(salvageSpriteScale(1000,.2,1),.25);
console.log('Salvage resolution and vector fallback checks passed');
