import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.model.js';
import connectDB from '../src/config/db.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    console.log('[SEED-ADMIN] Checking for admin user...');
    const adminEmail = 'jitenetakohar@gmail.com';
    const adminPassword = 'Jitendrakohar@123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      console.log('[SEED-ADMIN] Admin does not exist. Creating admin...');
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      admin = await User.create({
        name: 'Administrator',
        email: adminEmail,
        phone: '9999999999',
        passwordHash,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
      });
      console.log('[SEED-ADMIN] Admin created successfully!');
    } else {
      console.log('[SEED-ADMIN] Admin already exists. Updating role and status...');
      admin.role = 'ADMIN';
      admin.accountStatus = 'ACTIVE';
      admin.passwordHash = await bcrypt.hash(adminPassword, 12);
      await admin.save();
      console.log('[SEED-ADMIN] Admin updated successfully!');
    }

    mongoose.connection.close();
    console.log('[SEED-ADMIN] Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('[SEED-ADMIN] Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();
