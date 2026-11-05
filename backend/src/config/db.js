const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

// Set reliable DNS servers and force IPv4 first on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Ignore if running in a restricted sandbox where setServers is disallowed
}

let isConnected = false;

const readyStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const options = {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    autoIndex: true // Ensure indexes are created
  };

  try {
    const conn = await mongoose.connect(config.mongoUri, options);
    isConnected = true;
    console.log(`✅ [MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    console.log(`📦 [MongoDB Atlas] Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.error('❌ [MongoDB Atlas] Connection failed:', err.message);
    throw err;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('ℹ️ [MongoDB Atlas] Connection closed');
  }
}

function getConnectionStatus() {
  const state = mongoose.connection.readyState;
  return {
    stateCode: state,
    status: readyStateMap[state] || 'unknown',
    isHealthy: state === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
}

// Global mongoose event hooks
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ [MongoDB Atlas] Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ [MongoDB Atlas] Connection error:', err.message);
});

// Process signal handling
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus
};
