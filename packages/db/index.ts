import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js'; // Path to your npx prisma generate output
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// 1. Create the native PG driver instance
const pool = new pg.Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false // This allows the connection to Supabase's certificate
  }
});

// 2. Add an error listener to the pool to see exactly why it fails
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Client
export const db = new PrismaClient({ adapter });


console.log("DEBUG: Connection String is:", process.env.DATABASE_URL ? "FOUND" : "NOT FOUND");