require('dotenv').config();

const dns = require('dns');
const mongoose = require('mongoose');
const Intern = require('../models/Intern');
const Payment = require('../models/Payment');
const User = require('../models/User');

async function backfill() {
  if (process.env.MONGODB_DNS_SERVERS) dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(value => value.trim()));
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  const interns = await Intern.find({});
  let created = 0;
  for (const intern of interns) {
    const existing = await Payment.exists({ intern: intern._id, type: 'onboarding' });
    if (existing) continue;
    const title = intern.internshipPlan || `Custom ${intern.internshipDuration || 'Internship'} — Fee to configure`;
    await Payment.create({
      intern: intern._id,
      type: 'onboarding',
      title,
      description: intern.internshipPlan ? `Internship fee for ${intern.internshipPlan}` : 'Legacy internship record. Set the final fee manually from the student profile.',
      amount: Number(intern.internshipFee || 0),
      status: 'pending',
      paymentMethod: 'other',
      recordedBy: admin?._id,
    });
    created += 1;
  }
  console.log(`Legacy internship fee records created: ${created}.`);
  await mongoose.disconnect();
}

backfill().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
