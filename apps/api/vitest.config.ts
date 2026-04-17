import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Manually load the .env file
dotenv.config({ path: path.resolve(__dirname, '../../packages/db/.env') });

export default defineConfig({
  test: {
    environment: 'node',
    // This ensures your tests don't time out if Supabase is slow
    testTimeout: 10000, 
  },
});