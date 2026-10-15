require('dotenv').config();

const dns = require('dns');
const mongoose = require('mongoose');
const Domain = require('../models/Domain');

// These are intentionally separate from the existing Web Development domain.
const domains = [
  ['Data Science', 'BarChart2', '#7c3aed', ['Python', 'Pandas', 'SQL', 'Statistics']],
  ['Artificial Intelligence', 'Brain', '#059669', ['Python', 'Neural Networks', 'NLP', 'Computer Vision']],
  ['Machine Learning', 'Brain', '#16a34a', ['Python', 'Scikit-learn', 'TensorFlow', 'MLOps']],
  ['Generative AI', 'Brain', '#0f766e', ['LLMs', 'Prompt Engineering', 'RAG', 'Python']],
  ['Data Analytics', 'BarChart2', '#2563eb', ['Excel', 'SQL', 'Power BI', 'Tableau']],
  ['Business Analytics', 'BarChart2', '#4f46e5', ['SQL', 'Power BI', 'Statistics', 'Reporting']],
  ['Python Development', 'Code', '#eab308', ['Python', 'Django', 'Flask', 'REST APIs']],
  ['Java Development', 'Code', '#dc2626', ['Java', 'Spring Boot', 'Hibernate', 'SQL']],
  ['JavaScript Development', 'Code', '#d97706', ['JavaScript', 'TypeScript', 'ES6', 'APIs']],
  ['Node.js Backend Development', 'Code', '#15803d', ['Node.js', 'Express', 'MongoDB', 'REST APIs']],
  ['Full Stack Development', 'Code', '#7c3aed', ['React', 'Node.js', 'MongoDB', 'Git']],
  ['MERN Stack Development', 'Code', '#0891b2', ['MongoDB', 'Express', 'React', 'Node.js']],
  ['MEAN Stack Development', 'Code', '#be123c', ['MongoDB', 'Express', 'Angular', 'Node.js']],
  ['Mobile App Development', 'Smartphone', '#d97706', ['Flutter', 'React Native', 'Firebase', 'UI Design']],
  ['Android Development', 'Smartphone', '#65a30d', ['Kotlin', 'Android Studio', 'Firebase', 'Jetpack']],
  ['iOS Development', 'Smartphone', '#475569', ['Swift', 'SwiftUI', 'Xcode', 'Core Data']],
  ['Flutter Development', 'Smartphone', '#0284c7', ['Flutter', 'Dart', 'Firebase', 'REST APIs']],
  ['React Native Development', 'Smartphone', '#0369a1', ['React Native', 'JavaScript', 'Expo', 'Firebase']],
  ['DevOps Engineering', 'Cloud', '#0891b2', ['Docker', 'Kubernetes', 'CI/CD', 'Linux']],
  ['Cloud Computing', 'Cloud', '#0ea5e9', ['Cloud Fundamentals', 'Virtual Machines', 'Networking', 'Security']],
  ['AWS Cloud', 'Cloud', '#ea580c', ['AWS', 'EC2', 'S3', 'Lambda']],
  ['Microsoft Azure', 'Cloud', '#2563eb', ['Azure', 'App Service', 'DevOps', 'Cloud Security']],
  ['Google Cloud', 'Cloud', '#2563eb', ['GCP', 'Compute Engine', 'BigQuery', 'Cloud Run']],
  ['Cybersecurity', 'Shield', '#dc2626', ['Networking', 'Security', 'SIEM', 'Python']],
  ['Ethical Hacking', 'Shield', '#b91c1c', ['Kali Linux', 'Penetration Testing', 'OWASP', 'Burp Suite']],
  ['Networking', 'Cloud', '#0f766e', ['TCP/IP', 'Routing', 'Switching', 'Network Security']],
  ['Blockchain Development', 'Code', '#6d28d9', ['Solidity', 'Ethereum', 'Web3', 'Smart Contracts']],
  ['UI/UX Design', 'Globe', '#db2777', ['Figma', 'User Research', 'Prototyping', 'Design Systems']],
  ['Graphic Design', 'Globe', '#c026d3', ['Photoshop', 'Illustrator', 'Branding', 'Typography']],
  ['Product Management', 'BookOpen', '#9333ea', ['Product Strategy', 'Agile', 'Roadmaps', 'Analytics']],
  ['Software Testing & QA', 'Shield', '#ca8a04', ['Manual Testing', 'Test Cases', 'Jira', 'API Testing']],
  ['Automation Testing', 'Shield', '#65a30d', ['Selenium', 'Cypress', 'Playwright', 'JavaScript']],
  ['Database Administration', 'Database', '#1d4ed8', ['MySQL', 'PostgreSQL', 'Backup', 'Performance Tuning']],
  ['SQL & Data Engineering', 'Database', '#0369a1', ['SQL', 'ETL', 'Data Warehousing', 'Python']],
  ['Internet of Things (IoT)', 'Cloud', '#0d9488', ['Arduino', 'Sensors', 'MQTT', 'Embedded C']],
  ['Embedded Systems', 'Code', '#64748b', ['C', 'C++', 'Microcontrollers', 'RTOS']],
  ['Game Development', 'Code', '#7e22ce', ['Unity', 'C#', 'Unreal Engine', '3D Design']],
  ['AR/VR Development', 'Globe', '#9333ea', ['Unity', 'C#', 'ARCore', 'VR Design']],
  ['Digital Marketing', 'BarChart2', '#ea580c', ['SEO', 'Social Media', 'Google Ads', 'Analytics']],
  ['Salesforce Development', 'Cloud', '#0284c7', ['Apex', 'Lightning', 'Sales Cloud', 'Automation']],
].map(([name, icon, color, skills]) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  description: `Structured ${name} internship track with guided learning and projects.`,
  icon,
  color,
  skills,
  maxCapacity: 50,
  isActive: true,
}));

async function seed() {
  if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()));
  }
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  let created = 0;
  let existing = 0;
  for (const domain of domains) {
    const result = await Domain.updateOne(
      { name: domain.name },
      { $setOnInsert: domain },
      { upsert: true },
    );
    if (result.upsertedCount) created += 1;
    else existing += 1;
  }
  const total = await Domain.countDocuments();
  console.log(`Domains seed complete: ${created} created, ${existing} already existed, ${total} total.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
