const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');

async function startServer() {
  try {
    console.log('🔄 [CivicAI] Initializing database connection...');
    await connectDB();

    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`🚀 [CivicAI Backend] Server running on port ${PORT} (${config.nodeEnv})`);
      console.log(`🌐 [CivicAI Backend] Allowed origin: ${config.clientOrigin}`);
      console.log(`🩺 [CivicAI Backend] Health check: http://localhost:${PORT}/health`);
    });

    return server;
  } catch (err) {
    console.error('❌ [CivicAI Backend] Failed to start server:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
