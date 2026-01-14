import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Last miljøvariabler før databasen initialiseres
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

// Rens tilkoblingsstrengen for backticks og sitattegn hvis de finnes
const connectionString = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.trim().replace(/[`"']/g, '') 
  : undefined;

const sql = postgres(connectionString)

export default sql
