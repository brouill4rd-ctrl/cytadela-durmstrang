import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCorsOriginAllowed,
  isSessionVersionValid,
  parseCorsOrigins,
  resolveJwtSecret
} from './config/security.js';
import { validatePassword } from './utils/passwordPolicy.js';

test('produkcja nie uruchamia się bez własnego sekretu JWT', () => {
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '' }),
    /Brak JWT_SECRET/
  );
});

test('znany sekret legacy jest odrzucany w każdym środowisku', () => {
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'development', JWT_SECRET: 'durmstrang-cytadela-tajny-klucz-1294' }),
    /niebezpiecznej wartości legacy/
  );
});

test('development bez sekretu otrzymuje nieprzewidywalny sekret procesu', () => {
  const first = resolveJwtSecret({ NODE_ENV: 'development' });
  const second = resolveJwtSecret({ NODE_ENV: 'development' });
  assert.ok(first.length >= 32);
  assert.notEqual(first, second);
});

test('CORS w produkcji akceptuje tylko dokładną allowlistę', () => {
  const env = { NODE_ENV: 'production' };
  const origins = parseCorsOrigins('https://tmd.example, https://admin.tmd.example', env);
  assert.equal(isCorsOriginAllowed('https://tmd.example', origins, env), true);
  assert.equal(isCorsOriginAllowed('https://evil.example', origins, env), false);
  assert.throws(() => parseCorsOrigins('*', env), /nie może zawierać/);
  assert.throws(() => parseCorsOrigins('', env), /Brak CORS_ORIGIN/);
});

test('polityka haseł odrzuca wartości krótkie i banalne', () => {
  assert.equal(validatePassword('123').valid, false);
  assert.equal(validatePassword('aaaaaaaaaaaa').valid, false);
  assert.equal(validatePassword('SameLiteryBezCyfry').valid, false);
  assert.equal(validatePassword('DlugieHaslo!2026').valid, true);
});

test('zmiana wersji sesji unieważnia wcześniej wydany token', () => {
  assert.equal(isSessionVersionValid({ sessionVersion: 3 }, { session_version: 3 }), true);
  assert.equal(isSessionVersionValid({ sessionVersion: 2 }, { session_version: 3 }), false);
  assert.equal(isSessionVersionValid({}, { session_version: 0 }), false);
});
