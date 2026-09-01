import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `prisma` across hot reloads in development
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.prismaClient ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma;
}

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    // Test connection with a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ MySQL Database Connected successfully via Prisma ORM');
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('🔌 MySQL Database Disconnected');
  } catch (error) {
    console.error('Error disconnecting MySQL:', error);
  }
};
