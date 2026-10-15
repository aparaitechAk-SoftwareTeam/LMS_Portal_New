require('dotenv').config();

const dns = require('dns');
const mongoose = require('mongoose');
const User = require('../models/User');
const { LearningCourse } = require('../models/Learning');

const plans = [
  {
    title: '1 Month Internship',
    description: 'A focused 4-week internship for students who want to deliver one guided live project. Includes project briefing, weekly mentor checkpoints, source-code review and a final demonstration.',
    domain: 'Live Project Internship',
    price: 3000,
    modules: [
      { moduleId: 'one-month-kickoff', title: 'Week 1 — Project kickoff & planning', order: 0, lessons: [
        { lessonId: 'one-month-brief', title: 'Understand the live project brief', order: 0, durationMinutes: 60, isPreview: true },
        { lessonId: 'one-month-plan', title: 'Submit implementation plan', order: 1, durationMinutes: 90, isPreview: false },
      ] },
      { moduleId: 'one-month-build', title: 'Weeks 2–3 — Build & mentor review', order: 1, lessons: [
        { lessonId: 'one-month-build-task', title: 'Complete assigned live project tasks', order: 0, durationMinutes: 600, isPreview: false },
        { lessonId: 'one-month-review', title: 'Mentor code review', order: 1, durationMinutes: 45, isPreview: false },
      ] },
      { moduleId: 'one-month-final', title: 'Week 4 — Final delivery', order: 2, lessons: [
        { lessonId: 'one-month-demo', title: 'Project demo & final submission', order: 0, durationMinutes: 90, isPreview: false },
      ] },
    ],
  },
  {
    title: '2 Month Internship',
    description: 'An 8-week professional internship with two live project milestones. Students work through discovery, build, testing and deployment with regular mentor feedback and portfolio-ready evidence.',
    domain: 'Live Project Internship',
    price: 5000,
    modules: [
      { moduleId: 'two-month-foundation', title: 'Weeks 1–2 — Discovery & planning', order: 0, lessons: [
        { lessonId: 'two-month-brief', title: 'Project discovery and scope document', order: 0, durationMinutes: 90, isPreview: true },
        { lessonId: 'two-month-design', title: 'Create solution design', order: 1, durationMinutes: 180, isPreview: false },
      ] },
      { moduleId: 'two-month-milestone-one', title: 'Weeks 3–5 — Milestone one', order: 1, lessons: [
        { lessonId: 'two-month-build-one', title: 'Build and submit first project milestone', order: 0, durationMinutes: 900, isPreview: false },
        { lessonId: 'two-month-review-one', title: 'Mentor review & improvement cycle', order: 1, durationMinutes: 60, isPreview: false },
      ] },
      { moduleId: 'two-month-milestone-two', title: 'Weeks 6–8 — Milestone two & showcase', order: 2, lessons: [
        { lessonId: 'two-month-build-two', title: 'Complete final feature set', order: 0, durationMinutes: 900, isPreview: false },
        { lessonId: 'two-month-demo', title: 'Testing, deployment & project showcase', order: 1, durationMinutes: 180, isPreview: false },
      ] },
    ],
  },
  {
    title: '3 Month Internship',
    description: 'A 12-week career-focused internship featuring a capstone live project, structured reviews, deployment, professional documentation and job/HR interview readiness after successful completion.',
    domain: 'Live Project Internship',
    price: 6000,
    modules: [
      { moduleId: 'three-month-foundation', title: 'Month 1 — Foundation & project discovery', order: 0, lessons: [
        { lessonId: 'three-month-scope', title: 'Capstone scope and professional project plan', order: 0, durationMinutes: 120, isPreview: true },
        { lessonId: 'three-month-architecture', title: 'Architecture, workflow & delivery plan', order: 1, durationMinutes: 240, isPreview: false },
      ] },
      { moduleId: 'three-month-build', title: 'Month 2 — Capstone build', order: 1, lessons: [
        { lessonId: 'three-month-build-core', title: 'Deliver core capstone features', order: 0, durationMinutes: 1800, isPreview: false },
        { lessonId: 'three-month-review', title: 'Mid-internship mentor review', order: 1, durationMinutes: 90, isPreview: false },
      ] },
      { moduleId: 'three-month-career', title: 'Month 3 — Release & career readiness', order: 2, lessons: [
        { lessonId: 'three-month-release', title: 'Testing, deployment & documentation', order: 0, durationMinutes: 720, isPreview: false },
        { lessonId: 'three-month-showcase', title: 'Final presentation & portfolio showcase', order: 1, durationMinutes: 180, isPreview: false },
        { lessonId: 'three-month-interview', title: 'Job / HR interview readiness review', order: 2, durationMinutes: 60, isPreview: false },
      ] },
    ],
  },
];

async function seed() {
  if (process.env.MONGODB_DNS_SERVERS) dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(value => value.trim()));
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!admin) throw new Error('No admin user exists; internship plans cannot be assigned an owner.');
  let created = 0;
  let existing = 0;
  for (const plan of plans) {
    const result = await LearningCourse.updateOne(
      { title: plan.title },
      { $setOnInsert: { ...plan, status: 'published', isTrending: true, discountPercent: 0, createdBy: admin._id } },
      { upsert: true },
    );
    if (result.upsertedCount) created += 1;
    else existing += 1;
  }
  console.log(`Internship plans ready: ${created} created, ${existing} already existed.`);
  await mongoose.disconnect();
}

seed().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
