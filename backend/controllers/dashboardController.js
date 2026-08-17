const Intern = require('../models/Intern');
const { Project, Task, Submission } = require('../models/ProjectTask');
const { Attendance, Notification, ActivityLog } = require('../models/Others');

exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalInterns, activeInterns, completedInterns, terminatedInterns, totalProjects, ongoingProjects] = await Promise.all([
      Intern.countDocuments(),
      Intern.countDocuments({ status: 'active' }),
      Intern.countDocuments({ status: 'completed' }),
      Intern.countDocuments({ status: 'terminated' }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'ongoing' })
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({ date: today, status: { $ne: 'absent' } });

    // Task stats
    const taskStats = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const taskMap = {};
    taskStats.forEach(t => taskMap[t._id] = t.count);

    // Weekly performance (last 7 days)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySubmissions = await Submission.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } } } },
      { $sort: { '_id': 1 } }
    ]);

    // Monthly attendance
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthlyAttendance = await Attendance.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: { $dayOfMonth: '$date' }, present: { $sum: { $cond: [{ $ne: ['$status', 'absent'] }, 1, 0] } }, total: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    // Recent activity
    const recentActivities = await ActivityLog.find()
      .populate('user', 'name role avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // Department distribution
    const deptDistribution = await Intern.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Top performers
    const topPerformers = await Intern.find({ status: 'active' })
      .populate('user', 'name avatar email')
      .sort({ performanceScore: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: { totalInterns, activeInterns, completedInterns, terminatedInterns, totalProjects, ongoingProjects, todayAttendance },
        taskStats: taskMap,
        weeklySubmissions,
        monthlyAttendance,
        recentActivities,
        deptDistribution,
        topPerformers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInternDashboard = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id })
      .populate('team', 'name members leader')
      .populate('projects', 'title status progress deadline');
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

    const [myTasks, pendingTasks, submittedTasks, approvedTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: intern._id }),
      Task.countDocuments({ assignedTo: intern._id, status: 'pending' }),
      Task.countDocuments({ assignedTo: intern._id, status: 'submitted' }),
      Task.countDocuments({ assignedTo: intern._id, status: 'approved' })
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.findOne({ intern: intern._id, date: today });

    // Attendance % this month
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const attendanceRecords = await Attendance.find({ intern: intern._id, date: { $gte: monthStart } });
    const presentDays = attendanceRecords.filter(r => r.status !== 'absent').length;
    const attendancePercent = attendanceRecords.length ? Math.round((presentDays / attendanceRecords.length) * 100) : 0;

    // Upcoming deadlines
    const upcomingDeadlines = await Task.find({
      assignedTo: intern._id, status: { $in: ['pending', 'in_progress'] },
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }).sort({ dueDate: 1 }).limit(5);

    // Recent notifications
    const notifications = await Notification.find({ recipient: req.user._id, isRead: false })
      .sort({ createdAt: -1 }).limit(5);

    // Internship progress
    const totalDays = Math.ceil((intern.internshipEnd - intern.internshipStart) / (1000 * 60 * 60 * 24));
    const daysCompleted = Math.ceil((new Date() - intern.internshipStart) / (1000 * 60 * 60 * 24));
    const internshipProgress = Math.min(100, Math.round((daysCompleted / totalDays) * 100));

    res.json({
      success: true,
      data: {
        intern,
        taskStats: { myTasks, pendingTasks, submittedTasks, approvedTasks },
        todayAttendance,
        attendancePercent,
        upcomingDeadlines,
        notifications,
        internshipProgress
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
