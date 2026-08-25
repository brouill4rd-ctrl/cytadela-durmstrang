import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionsMatch, deriveMoonPhase, deriveTime, runeForDate, validateChanges } from './worldState.js';

test('pora dnia rozróżnia cztery okresy',()=>{assert.equal(deriveTime(new Date(2026,0,1,7)),'DAWN');assert.equal(deriveTime(new Date(2026,0,1,12)),'DAY');assert.equal(deriveTime(new Date(2026,0,1,19)),'DUSK');assert.equal(deriveTime(new Date(2026,0,1,23)),'NIGHT')});
test('faza księżyca i runa są deterministyczne',()=>{const d=new Date('2026-09-18T12:00:00Z');assert.equal(deriveMoonPhase(d),deriveMoonPhase(d));assert.deepEqual(runeForDate(d),runeForDate(d))});
test('warunki efektów są bezpieczne i obsługują próg zagrożenia',()=>{const s={weather:'BLIZZARD',timeOfDay:'NIGHT',threatLevel:'III'};assert.equal(conditionsMatch([{field:'weather',operator:'EQ',value:'BLIZZARD'},{field:'threatLevel',operator:'GTE',value:'III'}],s),true);assert.equal(conditionsMatch([{field:'threatLevel',operator:'GT',value:'III'}],s),false)});
test('walidacja odrzuca obce pola i niepoprawne enumy',()=>{assert.throws(()=>validateChanges({script:'eval()'}),/Niedozwolone/);assert.throws(()=>validateChanges({weather:'RAIN'}),/Nieprawidłowa/);assert.doesNotThrow(()=>validateChanges({weather:'BLIZZARD',temperature:-24,threatLevel:'III'}))});
