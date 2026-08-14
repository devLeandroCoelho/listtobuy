import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
});

if (process.env.NODE_ENV !== 'production') {
  console.log('Drizzle ORM initialized');
}