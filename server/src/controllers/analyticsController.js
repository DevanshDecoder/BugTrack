import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Get dashboard metrics and analytics for a project
// @route   GET /api/analytics/project/:projectId
// @access  Private
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // 1. Total counts
    const totalIssues = await Issue.countDocuments({ project: projectObjectId });
    const openIssues = await Issue.countDocuments({
      project: projectObjectId,
      status: 'Open',
    });
    const inProgressIssues = await Issue.countDocuments({
      project: projectObjectId,
      status: 'In Progress',
    });
    const resolvedIssues = await Issue.countDocuments({
      project: projectObjectId,
      status: 'Resolved',
    });
    const closedIssues = await Issue.countDocuments({
      project: projectObjectId,
      status: 'Closed',
    });
    const criticalIssues = await Issue.countDocuments({
      project: projectObjectId,
      priority: 'Critical',
      status: { $ne: 'Closed' },
    });

    // 2. Status distribution
    const statusDistribution = [
      { name: 'Open', count: openIssues, color: '#3B82F6' },
      { name: 'In Progress', count: inProgressIssues, color: '#F59E0B' },
      { name: 'Resolved', count: resolvedIssues, color: '#10B981' },
      { name: 'Closed', count: closedIssues, color: '#6B7280' },
    ];

    // 3. Priority distribution
    const priorityCounts = await Issue.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityMap = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    priorityCounts.forEach((item) => {
      if (item._id && priorityMap.hasOwnProperty(item._id)) {
        priorityMap[item._id] = item.count;
      }
    });

    const priorityDistribution = [
      { name: 'Low', count: priorityMap.Low, color: '#10B981' },
      { name: 'Medium', count: priorityMap.Medium, color: '#3B82F6' },
      { name: 'High', count: priorityMap.High, color: '#F59E0B' },
      { name: 'Critical', count: priorityMap.Critical, color: '#EF4444' },
    ];

    // 4. Team Workload (Issues assigned per team member)
    const workloadData = await Issue.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: '$assignee',
          total: { $sum: 1 },
          openCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['Open', 'In Progress']] }, 1, 0],
            },
          },
          resolvedCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Populate user details for workload
    const workloadWithUsers = await Promise.all(
      workloadData.map(async (item) => {
        if (!item._id) {
          return {
            userName: 'Unassigned',
            total: item.total,
            openCount: item.openCount,
            resolvedCount: item.resolvedCount,
          };
        }
        const user = await User.findById(item._id).select('name email avatar');
        return {
          userName: user ? user.name : 'Unknown User',
          userId: item._id,
          avatar: user?.avatar,
          total: item.total,
          openCount: item.openCount,
          resolvedCount: item.resolvedCount,
        };
      })
    );

    // 5. Date-based issue trends (last 7 days)
    const now = new Date();
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      past7Days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        start: startOfDay,
        end: endOfDay,
      });
    }

    const trends = await Promise.all(
      past7Days.map(async (day) => {
        const createdCount = await Issue.countDocuments({
          project: projectObjectId,
          createdAt: { $gte: day.start, $lte: day.end },
        });

        const resolvedCount = await Issue.countDocuments({
          project: projectObjectId,
          status: { $in: ['Resolved', 'Closed'] },
          updatedAt: { $gte: day.start, $lte: day.end },
        });

        return {
          date: day.label,
          created: createdCount,
          resolved: resolvedCount,
        };
      })
    );

    // 6. Recent activity in this project
    const recentActivities = await Activity.find({ project: projectObjectId })
      .populate('actor', 'name email avatar')
      .populate('issue', 'title issueKey')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalIssues,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          closed: closedIssues,
          critical: criticalIssues,
        },
        statusDistribution,
        priorityDistribution,
        teamWorkload: workloadWithUsers,
        trends,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activities for a specific issue
// @route   GET /api/analytics/issues/:issueId/activities
// @access  Private
export const getIssueActivities = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const activities = await Activity.find({ issue: issueId })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
