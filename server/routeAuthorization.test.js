import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const housesSource = fs.readFileSync(new URL('./routes/houses.js', import.meta.url), 'utf8');

test('mutacje Zakonów wymagają administratora', () => {
  assert.match(
    housesSource,
    /router\.put\('\/fortress-guardian',\s*requireAuth,\s*requireRole\('admin'\)/
  );
  assert.match(
    housesSource,
    /router\.put\('\/:id',\s*requireAuth,\s*requireRole\('admin'\)/
  );
});
