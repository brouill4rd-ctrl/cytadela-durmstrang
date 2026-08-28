import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAcceptanceClause,
  getLetterSalutation,
  resolvePolishGender
} from './utils/polishGender.js';

test('rozpoznaje żeńskie wartości płci używane podczas rejestracji i edycji profilu', () => {
  for (const value of ['Kobieta', 'kobieta', 'czarownica', 'czarodziejka']) {
    assert.equal(resolvePolishGender(value), 'feminine');
    assert.equal(getAcceptanceClause(value), 'zostałaś oficjalnie przyjęta');
  }
});

test('rozpoznaje męskie wartości płci i zachowuje bezpieczną zgodność ze starszymi kontami', () => {
  for (const value of ['Mężczyzna', 'czarodziej', '', null]) {
    assert.equal(resolvePolishGender(value), 'masculine');
    assert.equal(getAcceptanceClause(value), 'zostałeś oficjalnie przyjęty');
  }
});

test('dla mistyka stosuje neutralną gramatycznie treść', () => {
  assert.equal(resolvePolishGender('mistyk'), 'neutral');
  assert.equal(getAcceptanceClause('mistyk'), 'oficjalnie przyjęto Cię');
  assert.equal(getLetterSalutation('mistyk', 'Nox'), 'Szanowna Osobo Nox');
});

test('odmienia zwrot grzecznościowy zgodnie z płcią', () => {
  assert.equal(getLetterSalutation('Kobieta', 'Kowalska'), 'Szanowna Panno Kowalska');
  assert.equal(getLetterSalutation('czarownica', 'Vinter'), 'Szanowna Panno Vinter');
  assert.equal(getLetterSalutation('Mężczyzna', 'Kowalski'), 'Szanowny Panie Kowalski');
});
