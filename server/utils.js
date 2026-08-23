// Helper do normalizacji identyfikatorów Katedr / Przedmiotów
export function normalizeSubjectId(input) {
  if (!input) return 'eliksiry';
  const str = input.toLowerCase().trim();
  if (str.includes('eliksir') || str.includes('alchem')) return 'eliksiry';
  if (str.includes('czarn') || str.includes('mrok') || str.includes('nekro')) return 'czarna-magia';
  if (str.includes('run') || str.includes('futhark')) return 'starozytne-runy';
  if (str.includes('klatw') || str.includes('bojo') || str.includes('pojedyn')) return 'klatwy-i-uroki';
  if (str.includes('smok') || str.includes('magizoo') || str.includes('besti')) return 'magizoologia';
  if (str.includes('astro') || str.includes('zorz')) return 'astronomia';
  if (str.includes('transmut')) return 'transmutacja';
  if (str.includes('zielar')) return 'zielarstwo';
  if (str.includes('wrozb') || str.includes('volva')) return 'wrozbiarstwo';
  if (str.includes('numerol') || str.includes('arithm')) return 'numerologia';
  if (str.includes('zaklec') || str.includes('transgres')) return 'zaklecia';
  if (str.includes('histor')) return 'historia-magii';
  if (str.includes('latani') || str.includes('miot')) return 'latanie';
  if (str.includes('obron')) return 'obrona-przed-ciemnymi-mocami';
  if (str.includes('bial')) return 'biala-magia';
  return str.replace(/[^a-z0-9]/g, '-');
}

// Helper do normalizacji nazwy klasy (Klasa I, Klasa II, Klasa III, Klasa IV)
export function normalizeClassYear(input) {
  if (!input) return 'Klasa I';
  const str = input.toString().toLowerCase().trim();
  if (str === '1' || str === 'i' || str.includes('klasa 1') || str.includes('klasa i')) return 'Klasa I';
  if (str === '2' || str === 'ii' || str.includes('klasa 2') || str.includes('klasa ii')) return 'Klasa II';
  if (str === '3' || str === 'iii' || str.includes('klasa 3') || str.includes('klasa iii')) return 'Klasa III';
  if (str === '4' || str === 'iv' || str.includes('klasa 4') || str.includes('klasa iv')) return 'Klasa IV';
  return input;
}
