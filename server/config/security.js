import { randomBytes } from 'node:crypto';

const LEGACY_JWT_SECRET = 'durmstrang-cytadela-tajny-klucz-1294';
const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001'
];

export function resolveJwtSecret(env = process.env) {
  const configured = String(env.JWT_SECRET || '').trim();
  const isProduction = env.NODE_ENV === 'production';

  if (configured === LEGACY_JWT_SECRET) {
    throw new Error('JWT_SECRET używa znanej, niebezpiecznej wartości legacy. Ustaw nowy sekret o długości co najmniej 32 znaków.');
  }

  if (configured && configured.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET musi mieć co najmniej ${MIN_JWT_SECRET_LENGTH} znaki.`);
  }

  if (!configured && isProduction) {
    throw new Error('Brak JWT_SECRET. Serwer produkcyjny nie może uruchomić się bez własnego sekretu JWT.');
  }

  if (configured) return configured;

  // W development brak stałego fallbacku jest bezpieczniejszy niż sekret zapisany w kodzie.
  // Losowa wartość oznacza celowo, że sesje wygasną po restarcie procesu.
  return randomBytes(48).toString('base64url');
}

export function parseCorsOrigins(value, env = process.env) {
  const configured = String(value || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (env.NODE_ENV === 'production' && configured.length === 0) {
    throw new Error('Brak CORS_ORIGIN. Serwer produkcyjny wymaga jawnej allowlisty frontendu.');
  }

  const origins = configured.length > 0 ? configured : DEFAULT_DEVELOPMENT_ORIGINS;
  if (env.NODE_ENV === 'production' && origins.includes('*')) {
    throw new Error('CORS_ORIGIN nie może zawierać "*" w środowisku produkcyjnym.');
  }
  return origins;
}

export function isCorsOriginAllowed(origin, allowedOrigins, env = process.env) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return env.NODE_ENV !== 'production' && allowedOrigins.includes('*');
}

export const JWT_SECRET = resolveJwtSecret();
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '2h';
