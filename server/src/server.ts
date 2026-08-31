import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';
import { User } from './models/User';
import { seedDatabase } from './seed/seedData';

const startServer = async () => {
  try {
    console.log('🚀 Starting SecureHemas Backend Server...');
    await connectDB();

    // Auto-seed if database is completely empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Empty database detected. Automatically seeding initial demonstration data...');
      await seedDatabase();
    }

    const server = app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   SECUREHEMAS BACKEND READY                   ║
║  Information Security Policy & Compliance Management System   ║
║  Hemas Hospitals - University Cybersecurity Capstone Demo     ║
╠════════════════════════════════════════════════════════════════╣
║  • REST API:     http://localhost:${config.port}/api                 ║
║  • Health Check: http://localhost:${config.port}/api/health          ║
║  • Client App:   ${config.clientUrl}                        ║
║  • Environment:  ${config.nodeEnv.padEnd(44)}║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down SecureHemas server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
