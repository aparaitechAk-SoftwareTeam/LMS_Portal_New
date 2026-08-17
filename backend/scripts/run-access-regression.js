/*
 * Runs against a separate database named ims_access_regression.
 * It never reads, changes, or deletes data from the configured LMS database.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const testUrl = new URL(process.env.MONGO_URI);
testUrl.pathname = '/ims_access_regression';
process.env.MONGO_URI = testUrl.toString();
process.env.PORT = '0';
process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS = '12000';

const { server, io } = require('../server');
const User = require('../models/User');
const Intern = require('../models/Intern');
const { Team, SupportTicket, Notification } = require('../models/Others');
const { Project, Task } = require('../models/ProjectTask');
const { LearningCourse } = require('../models/Learning');
const { AssessmentQuestion } = require('../models/Engagement');
const { PersonalTodo } = require('../models/Engagement');

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const tokenFor = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

async function run() {
  await mongoose.connection.asPromise();
  assert(mongoose.connection.name === 'ims_access_regression', 'Refusing to run outside isolated regression database');
  await mongoose.connection.dropDatabase();
  const listener = await new Promise(resolve => server.listen(0, () => resolve(server)));
  const base = `http://127.0.0.1:${listener.address().port}/api`;
  const call = async (path, token, method = 'GET', body) => {
    const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  try {
    const [admin, userA, userB] = await Promise.all([
      User.create({ name: 'Regression Admin', email: 'reg-admin@example.test', password: 'regression-password', role: 'admin' }),
      User.create({ name: 'Regression Student A', email: 'reg-a@example.test', password: 'regression-password', role: 'intern' }),
      User.create({ name: 'Regression Student B', email: 'reg-b@example.test', password: 'regression-password', role: 'intern' })
    ]);
    const dates = { internshipStart: new Date('2026-01-01'), internshipEnd: new Date('2026-04-01'), department: 'Testing' };
    const [internA, internB] = await Promise.all([Intern.create({ ...dates, user: userA._id }), Intern.create({ ...dates, user: userB._id })]);
    const [teamA, teamB] = await Promise.all([Team.create({ name: 'Team A', leader: internA._id, members: [internA._id], createdBy: admin._id }), Team.create({ name: 'Team B', leader: internB._id, members: [internB._id], createdBy: admin._id })]);
    const [projectA, projectB] = await Promise.all([Project.create({ title: 'Project A', description: 'Owned by A', assignedTo: [internA._id], team: teamA._id, createdBy: admin._id }), Project.create({ title: 'Project B', description: 'Owned by B', assignedTo: [internB._id], team: teamB._id, createdBy: admin._id })]);
    await Promise.all([Task.create({ title: 'Task A', description: 'A only', assignedTo: [internA._id], dueDate: new Date('2026-03-01'), createdBy: admin._id }), Task.create({ title: 'Task B', description: 'B only', assignedTo: [internB._id], dueDate: new Date('2026-03-01'), createdBy: admin._id })]);
    const course = await LearningCourse.create({ title: 'Free Regression Course', description: 'Free enrollment guard test', status: 'published', price: 0, createdBy: admin._id });
    const question = await AssessmentQuestion.create({ domain: 'testing', topic: 'access', difficulty: 'basic', text: 'Which response denies access?', options: ['200', '201', '403', '500'], correctOption: '403', createdBy: admin._id });
    const tokenA = tokenFor(userA); const tokenB = tokenFor(userB); const adminToken = tokenFor(admin);
    const [otherProject, otherTeam, ownTasks, enrollment, adminQuestionList, adminReviewList, adminJobList, calendarDenied, calendarCreated, checkIn, internAttendanceDenied] = await Promise.all([call(`/projects/${projectB._id}`, tokenA), call(`/teams/${teamB._id}`, tokenA), call('/tasks', tokenA), call(`/learning/${course._id}/self-enroll`, tokenA, 'POST'), call('/engagement/assessments/questions', tokenA), call('/engagement/project-reviews', tokenA), call('/engagement/job-applications', tokenA), call(`/engagement/calendar/${teamB._id}`, tokenA), call(`/engagement/calendar/${teamA._id}`, tokenA, 'POST', { title: 'Regression meeting', startAt: '2026-02-01T10:00:00.000Z', endAt: '2026-02-01T11:00:00.000Z' }), call('/attendance/check-in', tokenA, 'POST'), call('/attendance', tokenA)]);
    assert(otherProject.status === 403, 'Student accessed another student project');
    assert(otherTeam.status === 403, 'Student accessed another team');
    assert(ownTasks.status === 200 && ownTasks.body.data.length === 1 && ownTasks.body.data[0].title === 'Task A', 'Task list is not ownership-scoped');
    assert(enrollment.status === 201, 'Free course enrollment failed');
    assert([adminQuestionList.status, adminReviewList.status, adminJobList.status].every(status => status === 403), 'Intern accessed an admin-only workflow route');
    assert(calendarDenied.status === 403 && calendarCreated.status === 201, 'Team calendar access controls failed');
    assert(checkIn.status === 200 && internAttendanceDenied.status === 403, 'Attendance check-in/admin guard failed');
    const myCourses = await call('/learning/my-courses', tokenA);
    assert(myCourses.status === 200 && myCourses.body.data.some(item => String(item.course._id) === String(course._id)), 'Enrollment did not appear in My Learning');
    const todoCreated = await call('/engagement/todos', tokenA, 'POST', { title: 'Regression to-do' });
    assert(todoCreated.status === 201, 'Personal to-do creation failed');
    const todoDenied = await call(`/engagement/todos/${todoCreated.body.data._id}`, tokenB, 'PUT', { isCompleted: true });
    assert(todoDenied.status === 404, 'Student changed another user to-do');
    const checkOut = await call('/attendance/check-out', tokenA, 'POST');
    const myAttendance = await call('/attendance/my', tokenA);
    assert(checkOut.status === 200 && myAttendance.status === 200 && myAttendance.body.data.length === 1, 'Attendance checkout/history failed');
    const assessment = await call('/engagement/assessments/submit', tokenA, 'POST', { domain: 'testing', topic: 'access', difficulty: 'basic', answers: [{ questionId: question._id, selectedOption: '403' }] });
    assert(assessment.status === 201 && assessment.body.data.score === 1, 'Assessment grading failed');
    const deniedReview = await call('/engagement/project-reviews', tokenA, 'POST', { projectId: projectB._id, notes: 'Trying another student project' });
    assert(deniedReview.status === 403, 'Student submitted review for another student project');
    const jobLocked = await call('/engagement/job-applications', tokenA, 'POST', { projectId: projectA._id });
    assert(jobLocked.status === 403, 'Job application bypassed 100% project requirement');
    projectA.progress = 100; await projectA.save();
    const jobUnlocked = await call('/engagement/job-applications', tokenA, 'POST', { projectId: projectA._id, portfolioUrl: 'https://example.test/portfolio' });
    assert(jobUnlocked.status === 201, 'Job application did not unlock at 100% project progress');
    const createdTicket = await call('/tickets', tokenA, 'POST', { subject: 'Regression ticket', description: 'Student A support request', category: 'technical', priority: 'medium' });
    assert(createdTicket.status === 201, 'Student could not create a support ticket');
    const ticketB = await SupportTicket.create({ intern: internB._id, subject: 'Private student B ticket', description: 'B only' });
    const [ticketList, deniedTicketReply, adminReply] = await Promise.all([
      call('/tickets', tokenA),
      call(`/tickets/${ticketB._id}/reply`, tokenA, 'POST', { message: 'Unauthorized reply' }),
      call(`/tickets/${createdTicket.body.data._id}/reply`, adminToken, 'POST', { message: 'Admin response' })
    ]);
    assert(ticketList.status === 200 && ticketList.body.data.length === 1 && String(ticketList.body.data[0]._id) === String(createdTicket.body.data._id), 'Student ticket list is not ownership-scoped');
    assert(deniedTicketReply.status === 403, 'Student replied to another student ticket');
    assert(adminReply.status === 200, 'Admin could not reply to student ticket');
    const notificationB = await Notification.create({ recipient: userB._id, type: 'announcement', title: 'Private notification', message: 'For student B only' });
    const deniedNotificationRead = await call(`/notifications/${notificationB._id}/read`, tokenA, 'PUT');
    assert(deniedNotificationRead.status === 404, 'Student marked another user notification as read');
    const myNotifications = await call('/notifications', tokenA);
    assert(myNotifications.status === 200 && myNotifications.body.data.some(item => item.title === 'Support ticket reply'), 'Admin ticket reply notification was not delivered');
    console.log('PASS: enrollment, ownership, attendance, calendar, to-do, assessment, review, job, ticket, notification and admin-route checks');
  } finally {
    await new Promise(resolve => io.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

run().catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1; });
