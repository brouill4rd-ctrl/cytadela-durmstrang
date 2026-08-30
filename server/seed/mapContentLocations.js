// Wspólne źródło zawartości dla obu warstw mapy: Twierdzy i świata.

import { SEED_LOCATIONS } from './locationsData.js';
import { WORLD_SEED_LOCATIONS } from './worldLocationsData.js';

export const MAP_CONTENT_LOCATIONS = [
  ...SEED_LOCATIONS,
  ...WORLD_SEED_LOCATIONS,
];

export { SEED_LOCATIONS as FORTRESS_SEED_LOCATIONS, WORLD_SEED_LOCATIONS };
