const {test} = require('node:test');
const assert = require('node:assert/strict');
const {OutWestSepticServiceAreaMap: Map} = require('../map.js');
const data = require('../data.js');

test('published points preserve categories while avoiding an office location claim', () => {
  const points = Map.normalize(data);
  assert.equal(points.length, 14);
  assert.equal(points.filter(point => point.kind === 'county').length, 7);
  assert.deepEqual(points.filter(point => point.kind === 'excluded').map(point => point.name), ['Parker County','Tarrant County']);
  assert.equal(points[0].name, 'Lone Camp vicinity');
  assert.match(Map.descriptions.reference, /not an office/);
  assert.match(Map.descriptions.county, /not a county boundary/);
});
test('empty configurations and optional groups have defined behavior', () => {
  assert.deepEqual(Map.normalize({}), []);
  assert.deepEqual(Map.normalize({towns:[]}), []);
  assert.equal(Map.normalize({towns:[{name:' Example ',lat:0,lon:0}]} )[0].name, 'Example');
});
test('invalid coordinate types, nonfinite values, and out-of-range coordinates fail closed', () => {
  const point = {name:'Example', lat:32, lon:-98};
  for (const override of [{lat:'32'}, {lat:NaN}, {lat:Infinity}, {lat:91}, {lon:-181}, {lon:null}, {name:''}, {name:'x'.repeat(201)}]) {
    assert.throws(() => Map.normalize({towns:[{...point,...override}]}));
  }
  for (const bad of [null, [], 'invalid', {counties:{}}, {towns:[null]}]) assert.throws(() => Map.normalize(bad));
});
test('valid geographic coordinate boundaries and user-supplied point names are retained', () => {
  const points = Map.normalize({towns:[{name:'<b>Literal user label</b>',lat:-90,lon:180},{name:'Other',lat:90,lon:-180}]});
  assert.equal(points[0].name, '<b>Literal user label</b>');
  assert.equal(points[1].lon, -180);
});
