require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const User = require('../models/User');

if (process.env.MONGODB_DNS_SERVERS) {
  dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(server => server.trim()));
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.deleteOne({ email: 'admin@company.com' });
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@company.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true
  });
  console.log('Admin created:', admin.email, '| Password: Admin@123');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
