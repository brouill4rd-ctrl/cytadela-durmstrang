// Kompilator starszej zawartości mapy do wykonywalnych definicji silnika questów.
// Nie używa solutionKeywords — wszystkie decyzje są walidowane po actionId na serwerze.

import { MAP_CONTENT_LOCATIONS } from './mapContentLocations.js';

const CHAIN_PREDECESSOR = {
  'quest-wl-fortress-nocny-intruz': 'quest-wl-fortress-tutorial',
  'quest-jot-zielarka': 'quest-jot-slady',
  'quest-jot-kamienie': 'quest-jot-zielarka',
  'quest-jot-chain-final': 'quest-jot-kamienie',
  'quest-fiord-syrena': 'quest-fiord-wrak',
  'quest-frost-ekspedycja': 'quest-frost-droga',
  'quest-havnhold-2': 'quest-havnhold-1',
  'quest-havnhold-4': 'quest-havnhold-2',
  'quest-havnhold-final': 'quest-havnhold-4',
  'quest-rune-dziewiec': 'quest-rune-algiz',
  'quest-rune-grobowiec': 'quest-rune-dziewiec',
  'quest-varg-pierscien': 'quest-varg-groby',
  'quest-skall-herb': 'quest-skall-kamienie',
  'quest-skall-historia': 'quest-skall-herb',
  'quest-fjorm-statek-widmo': 'quest-fjorm-przemytnicy',
};

const RUNESTONE_IDS = Array.from({ length: 12 }, (_, index) => `quest-rune-stone-${index + 1}`);

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function questRequirements(questId, locationId) {
  const requirements = [
    { type: 'location_discovered', id: locationId },
  ];

  const predecessor = CHAIN_PREDECESSOR[questId];
  if (predecessor) requirements.push({ type: 'quest_completed', id: predecessor });

  if (questId === 'quest-stone-13-final') {
    requirements.push(...RUNESTONE_IDS.map(id => ({ type: 'quest_completed', id })));
  }

  return requirements.length === 1 ? requirements[0] : { all: requirements };
}

function questChainId(questId, locationId) {
  if (questId.startsWith('quest-rune-stone-') || questId === 'quest-stone-13-final') return 'world-rune-stones';
  if (questId.startsWith('quest-havnhold-')) return 'world-havnhold';
  if (questId.startsWith('quest-skall-')) return 'world-skallgard';
  if (questId.startsWith('quest-jot-')) return 'world-jotunskog';
  return `world-${locationId}`;
}

function normalizeActionLabel(action, index) {
  const label = typeof action === 'string' ? action : action?.label;
  return String(label || `Wybór ${index + 1}`).trim().slice(0, 80);
}

function buildStages(legacyQuest, sequence) {
  const suggestedActions = Array.isArray(legacyQuest.suggestedActions)
    ? legacyQuest.suggestedActions
    : [];
  const openingPlatform = sequence % 2 === 0 ? 'web' : 'discord';
  const resolutionPlatform = openingPlatform === 'web' ? 'discord' : 'web';
  const successText = legacyQuest.successMessage || 'Twoje działanie przynosi rezultat i odsłania dalszą część historii.';

  const fjormhardArtifacts = [
    'Zapieczętowany Artefakt Północy',
    'Klucz Przemytników Fjormhardu',
    'Nieoznaczony Artefakt Północy',
  ];
  const actions = (suggestedActions.length > 0 ? suggestedActions : [{ label: 'Kontynuuj' }]).map((action, index) => {
    const label = normalizeActionLabel(action, index);
    return {
      id: `wybor_${index + 1}`,
      label,
      score: Math.max(1, suggestedActions.length - index),
      result_narrative: `Wybierasz: **${label}**. Ta decyzja zostaje zapisana w kronice wyprawy.`,
      ...(legacyQuest.id === 'quest-fjorm-przemytnicy'
        ? { reward_item: fjormhardArtifacts[index] || fjormhardArtifacts[0] }
        : {}),
    };
  });

  return [
    {
      index: 0,
      type: 'choice',
      platform: openingPlatform,
      title: legacyQuest.title,
      narrative: legacyQuest.initialBotMessage || legacyQuest.description,
      objective: 'Wybierz sposób działania',
      actions,
    },
    {
      index: 1,
      type: 'dialogue',
      platform: resolutionPlatform,
      title: 'Rezultat wyprawy',
      narrative: successText,
      objective: 'Zapisz rezultat w kronice',
      actions: [
        {
          id: 'zakoncz',
          label: 'Zakończ quest',
          result_narrative: successText,
        },
      ],
    },
  ];
}

function normalizeRewards(reward = {}) {
  return {
    points: Number(reward.points) || 0,
    xp: Number(reward.xp) || 0,
    // Galleony występowały wyłącznie w starszej warstwie Twierdzy.
    // Portal posiada jeden centralny portfel, więc są migrowane do Skirnirów.
    skirniry: Number(reward.skirniry ?? reward.galleons) || 0,
    ...(reward.item ? { item: reward.item } : {}),
  };
}

export function buildWorldQuestDefinitions(locations = MAP_CONTENT_LOCATIONS) {
  const definitions = [];
  let sequence = 0;

  for (const location of locations) {
    const legacyQuests = parseJsonArray(location.quests);
    legacyQuests.forEach((legacyQuest, index) => {
      definitions.push({
        id: legacyQuest.id,
        version: 1,
        title: legacyQuest.title,
        description: legacyQuest.description || '',
        category: legacyQuest.category || 'Quest świata',
        difficulty: legacyQuest.difficulty || 'Łatwy',
        location_id: location.id,
        chain_id: questChainId(legacyQuest.id, location.id),
        order_index: 100 + index,
        requirements: questRequirements(legacyQuest.id, location.id),
        stages: buildStages(legacyQuest, sequence),
        rewards: normalizeRewards(legacyQuest.reward),
        on_complete_unlock: [],
        legacy_source: true,
      });
      sequence += 1;
    });
  }

  return definitions;
}

export const WORLD_QUEST_DEFINITIONS = buildWorldQuestDefinitions();

export function auditWorldQuestDefinitions(locations = MAP_CONTENT_LOCATIONS, definitions = WORLD_QUEST_DEFINITIONS) {
  const legacyIds = locations.flatMap(location => parseJsonArray(location.quests).map(quest => quest.id));
  const definitionById = new Map(definitions.map(definition => [definition.id, definition]));
  const missing = legacyIds.filter(id => !definitionById.has(id));
  const invalid = [];

  for (const id of legacyIds) {
    const definition = definitionById.get(id);
    if (!definition) continue;
    if (!definition.location_id || !definition.title || !definition.stages?.length) invalid.push(`${id}: brak podstawowych danych`);
    for (const stage of definition.stages || []) {
      if (!['web', 'discord', 'both'].includes(stage.platform || 'both')) invalid.push(`${id}: błędna platforma etapu ${stage.index}`);
      if (!stage.actions?.length) invalid.push(`${id}: etap ${stage.index} nie ma działań`);
      for (const action of stage.actions || []) {
        if (!action.id || !action.label) invalid.push(`${id}: niepełne działanie w etapie ${stage.index}`);
      }
    }
  }

  return {
    legacyCount: legacyIds.length,
    generatedCount: definitions.length,
    missing,
    invalid,
    complete: missing.length === 0 && invalid.length === 0 && legacyIds.length === definitions.length,
  };
}
