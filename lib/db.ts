import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL ?? '';
const sql = databaseUrl ? neon(databaseUrl) : (undefined as any);
export const db = databaseUrl ? drizzle(sql) : (undefined as any);
