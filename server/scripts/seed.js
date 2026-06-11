import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.model.js';
import CropCycle from '../src/models/CropCycle.model.js';
import Expense from '../src/models/Expense.model.js';
import Transaction from '../src/models/Transaction.model.js';
import Approval from '../src/models/Approval.model.js';
import TransactionRevision from '../src/models/TransactionRevision.model.js';
import connectDB from '../src/config/db.js';

const seedData = async () => {
  try {
    await connectDB();

    console.log('[SEED] Clearing database...');
    await User.deleteMany({});
    await CropCycle.deleteMany({});
    await Expense.deleteMany({});
    await Transaction.deleteMany({});
    await Approval.deleteMany({});
    await TransactionRevision.deleteMany({});

    console.log('[SEED] Creating users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const farmer = await User.create({
      name: 'Rajesh Kumar',
      email: 'farmer@test.com',
      phone: '9876543210',
      passwordHash,
      role: 'FARMER',
    });

    const buyer = await User.create({
      name: 'Amit Sharma',
      email: 'buyer@test.com',
      phone: '8765432109',
      passwordHash,
      role: 'BUYER',
    });

    console.log('[SEED] Creating crop cycles...');
    const crop1 = await CropCycle.create({
      farmerId: farmer._id,
      cropName: 'Wheat 2026',
      seasonYear: 'Rabi 2026',
      startDate: new Date('2026-03-01'),
      status: 'ACTIVE',
    });

    const crop2 = await CropCycle.create({
      farmerId: farmer._id,
      cropName: 'Rice 2025',
      seasonYear: 'Kharif 2025',
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-10-30'),
      status: 'COMPLETED',
    });

    console.log('[SEED] Creating expenses...');
    // Crop 1 (Wheat 2026) Expenses
    await Expense.create({
      cropCycleId: crop1._id,
      farmerId: farmer._id,
      category: 'Machinery',
      amount: 5000,
      spentOnDate: new Date('2026-03-10'),
      note: 'Ploughing wheat field with rented tractor',
    });

    await Expense.create({
      cropCycleId: crop1._id,
      farmerId: farmer._id,
      category: 'Fertilizers',
      amount: 3500,
      spentOnDate: new Date('2026-03-25'),
      note: 'Urea and DAP fertilizers from Kisan Kendra',
    });

    await Expense.create({
      cropCycleId: crop1._id,
      farmerId: farmer._id,
      category: 'Water',
      amount: 2000,
      spentOnDate: new Date('2026-04-05'),
      note: 'Tubewell water pumping charges',
    });

    // Crop 2 (Rice 2025) Expenses
    await Expense.create({
      cropCycleId: crop2._id,
      farmerId: farmer._id,
      category: 'Labor',
      amount: 6000,
      spentOnDate: new Date('2025-07-02'),
      note: 'Paddy transplanting labour charges',
    });

    await Expense.create({
      cropCycleId: crop2._id,
      farmerId: farmer._id,
      category: 'Pesticides',
      amount: 2500,
      spentOnDate: new Date('2025-08-15'),
      note: 'Stem borer pest spray',
    });

    await Expense.create({
      cropCycleId: crop2._id,
      farmerId: farmer._id,
      category: 'Machinery',
      amount: 8000,
      spentOnDate: new Date('2025-10-25'),
      note: 'Harvester machine contract',
    });

    console.log('[SEED] Creating transactions...');
    
    // Transaction 1: Rice 2025 completed sale (FINAL)
    const t1 = await Transaction.create({
      farmerId: farmer._id,
      buyerId: buyer._id,
      cropCycleId: crop2._id,
      quantity: 5000,
      unit: 'kg',
      pricePerUnit: 25,
      totalAmount: 125000,
      transactionDate: new Date('2025-11-05'),
      paymentStatus: 'PARTIAL',
      amountPaid: 80000,
      amountDue: 45000,
      status: 'FINAL',
      createdByUserId: farmer._id,
      notes: 'High quality Basmati rice sale.',
    });

    await Approval.create({
      transactionId: t1._id,
      userId: buyer._id,
      decision: 'APPROVED',
      comment: 'Rice received. Quality is excellent. Paid 80k cash, remaining 45k due next month.',
      decidedAt: new Date('2025-11-06'),
    });

    // Transaction 2: Wheat 2026 pending sale (PENDING)
    await Transaction.create({
      farmerId: farmer._id,
      buyerId: buyer._id,
      cropCycleId: crop1._id,
      quantity: 2000,
      unit: 'kg',
      pricePerUnit: 30,
      totalAmount: 60000,
      transactionDate: new Date('2026-05-10'),
      paymentStatus: 'DUE',
      amountPaid: 0,
      amountDue: 60000,
      status: 'PENDING',
      createdByUserId: farmer._id,
      notes: 'Wheat harvest sale proposal. Rate locked at ₹30/kg.',
    });

    // Transaction 3: Buyer proposed purchase that was sent for changes (CHANGES_REQUESTED)
    const t3 = await Transaction.create({
      farmerId: farmer._id,
      buyerId: buyer._id,
      cropCycleId: crop1._id,
      quantity: 1500,
      unit: 'kg',
      pricePerUnit: 28,
      totalAmount: 42000,
      transactionDate: new Date('2026-05-20'),
      paymentStatus: 'DUE',
      amountPaid: 0,
      amountDue: 42000,
      status: 'CHANGES_REQUESTED',
      createdByUserId: buyer._id,
      notes: 'Bulk wheat purchase proposal by Amit.',
    });

    await Approval.create({
      transactionId: t3._id,
      userId: farmer._id,
      decision: 'REQUESTED_CHANGES',
      comment: 'Please check quantity. I think we agreed on 1200kg only for this batch.',
      decidedAt: new Date('2026-05-21'),
    });

    console.log('[SEED] Seeding database completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('[SEED] Seeding error:', error);
    process.exit(1);
  }
};

seedData();
