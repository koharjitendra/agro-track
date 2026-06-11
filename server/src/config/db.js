import dns from 'dns';
import mongoose from 'mongoose';
import config from './env.js';

// Node on Windows often fails mongodb+srv SRV lookups (querySrv ECONNREFUSED).
const dnsServers = process.env.DNS_SERVERS?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsServers?.length) {
  dns.setServers(dnsServers);
} else if (process.platform === 'win32' && config.MONGO_URL.includes('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGO_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Connection Error: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      console.error(
        '[DB] Hostname not found — your MONGO_URL is wrong or the Atlas cluster was deleted. Use a fresh URI from Atlas or local: mongodb://127.0.0.1:27017/agro_track'
      );
    } else if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error(
        '[DB] DNS SRV lookup failed. Set DNS_SERVERS=8.8.8.8,8.8.4.4 in .env or use a standard mongodb:// URI from Atlas (Connect → Drivers → "Connection string only").'
      );
    }
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose runtime error: ${err.message}`);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed on SIGINT');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed on SIGTERM');
  process.exit(0);
});

export default connectDB;
