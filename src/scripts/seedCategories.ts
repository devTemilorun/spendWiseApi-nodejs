import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Category } from '../models/Category.model';

const defaultCategories = [
  {
    name: 'groceries',
    isFlagged: false,
    keywords: ['SPAR', 'SHOPRITE', 'MARKET', 'JUSTRITE', 'EBEANO', 'PRINCE EBEANO'],
  },
  {
    name: 'transport',
    isFlagged: false,
    keywords: ['UBER', 'BOLT', 'FUEL', 'PETROL', 'NNPC', 'TOTAL', 'MOBIL'],
  },
  {
    name: 'entertainment',
    isFlagged: false,
    keywords: ['NETFLIX', 'DSTV', 'GOTV', 'SPOTIFY', 'SHOWMAX', 'APPLE MUSIC'],
  },
  {
    name: 'gambling',
    isFlagged: true,
    keywords: ['BET9JA', 'BETKING', 'SPORTYBET', '1XBET', 'NAIRABET', 'BETANO'],
  },
  {
    name: 'bills',
    isFlagged: false,
    keywords: ['PHCN', 'ELECTRICITY', 'WATER', 'RENT', 'IKEDC', 'EKEDC', 'MTN', 'AIRTEL', 'GLO', '9MOBILE'],
  },
  {
    name: 'health',
    isFlagged: false,
    keywords: ['PHARMACY', 'HOSPITAL', 'CLINIC', 'MEDPLUS', 'HEALTHPLUS'],
  },
  {
    name: 'other',
    isFlagged: false,
    keywords: [],
  },
];

const seed = async () => {
  await connectDB();
  console.log('Seeding categories...');

  for (const cat of defaultCategories) {
    const existing = await Category.findOne({ name: cat.name, userId: null });
    if (existing) {
      console.log(`${cat.name} already exists`);
      continue;
    }
    await Category.create({ ...cat, userId: null });
    console.log(`Created ${cat.name}`);
  }

  await mongoose.connection.close();
  console.log('Done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});