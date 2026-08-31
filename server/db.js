import db from './db/connection.js';
import { runMigrations } from './db/migrations.js';
import { runSeed } from './db/seed.js';

runMigrations();
runSeed();

export * from './db/mappers.js';
export default db;
