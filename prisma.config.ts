import { defineConfig } from '@prisma/config';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  }
});
