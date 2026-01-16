import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Last miljøvariabler før databasen initialiseres
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/[\s`"']/g, '') : null;

if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL is missing in environment variables!');
} else {
  const maskedUrl = connectionString.replace(/:([^@:]+)@/, ':****@');
  console.log(`Database connection string (cleaned) loaded: ${maskedUrl.substring(0, 30)}...`);
}

const sql = postgres(connectionString);

export default sql
