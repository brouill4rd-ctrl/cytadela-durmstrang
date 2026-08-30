import test from 'node:test';
import assert from 'node:assert/strict';
import { neridaDiscordBot, questDiscordBot } from './discordBot.js';

test('bot questów nie rejestruje komend szkolnych', () => {
  assert.equal(questDiscordBot.role, 'quest');
  assert.deepEqual(questDiscordBot.getSlashCommands(), []);
});

test('Nerida przejmuje wszystkie komendy szkolne i użytkowe', () => {
  assert.equal(neridaDiscordBot.role, 'utility');
  assert.deepEqual(
    neridaDiscordBot.getSlashCommands().map(command => command.name),
    [
      'powitaj',
      'lekcja',
      'quiz',
      'pytanie',
      'zaklecie',
      'losowanie',
      'weryfikuj',
      'synchronizuj',
      'profil',
      'odlacz',
      'pamiec',
      'eksport'
    ]
  );
});
