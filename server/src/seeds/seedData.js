import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import Activity from '../models/Activity.js';

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugtrack';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB for seeding: ${mongoUri}`);

    // Clear existing collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Issue.deleteMany({});
    await Comment.deleteMany({});
    await Activity.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Alex Rivera',
      email: 'admin@bugtrack.io',
      password: 'password123',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const devUser = await User.create({
      name: 'Devon Vance',
      email: 'dev@bugtrack.io',
      password: 'password123',
      role: 'Developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    const reporterUser = await User.create({
      name: 'Sarah Chen',
      email: 'reporter@bugtrack.io',
      password: 'password123',
      role: 'Reporter',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    });

    console.log('Created demo users: Admin, Developer, Reporter');

    // 2. Create Project
    const project = await Project.create({
      name: 'BugTrack Core Platform',
      key: 'BUG',
      description: 'Central issue and sprint board for the BugTrack enterprise SaaS platform.',
      owner: adminUser._id,
      members: [
        { user: adminUser._id, role: 'Admin' },
        { user: devUser._id, role: 'Developer' },
        { user: reporterUser._id, role: 'Reporter' },
      ],
      issueCounter: 8,
    });

    console.log(`Created project: ${project.name} (${project.key})`);

    // 3. Create Issues
    const issuesData = [
      {
        issueKey: 'BUG-1',
        title: 'Memory leak during WebSocket heartbeat reconnection cycle',
        description:
          'When the client loses connectivity and reconnects multiple times in quick succession, listener references are retained in the socket manager pool, leading to steady heap allocation growth.',
        status: 'Open',
        priority: 'Critical',
        project: project._id,
        reporter: reporterUser._id,
        assignee: devUser._id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['backend', 'performance', 'sockets'],
      },
      {
        issueKey: 'BUG-2',
        title: 'OAuth2 Google Sign-in fails with redirect_uri_mismatch on staging',
        description:
          'Staging environment callback URL was misconfigured in Google Cloud Console after recent DNS cutover. Developers receive error 400 when attempting OAuth login.',
        status: 'In Progress',
        priority: 'High',
        project: project._id,
        reporter: reporterUser._id,
        assignee: devUser._id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['auth', 'security', 'staging'],
      },
      {
        issueKey: 'BUG-3',
        title: 'Payment webhook race condition creates duplicate subscription records',
        description:
          'Stripe invoice.payment_succeeded and customer.subscription.created events arrive within milliseconds, causing a concurrency collision in the webhook handler without idempotency locking.',
        status: 'In Progress',
        priority: 'Critical',
        project: project._id,
        reporter: adminUser._id,
        assignee: devUser._id,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        tags: ['billing', 'database', 'high-priority'],
      },
      {
        issueKey: 'BUG-4',
        title: 'Add CSV export capability for filtered issue query results',
        description:
          'Product managers need the ability to export the current view table of issues with applied filters to a CSV file for quarterly audits.',
        status: 'Open',
        priority: 'Medium',
        project: project._id,
        reporter: reporterUser._id,
        assignee: null,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['feature', 'reporting'],
      },
      {
        issueKey: 'BUG-5',
        title: 'JWT token expiration modal does not redirect cleanly to login screen',
        description:
          'When session expires after 7 days, the Axios interceptor displays an alert but fails to purge localStorage state before routing.',
        status: 'Resolved',
        priority: 'High',
        project: project._id,
        reporter: devUser._id,
        assignee: devUser._id,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ['frontend', 'auth', 'ux'],
      },
      {
        issueKey: 'BUG-6',
        title: 'Update documentation footer copyright year and privacy policy link',
        description:
          'Legal team requested updated links to the newly published Terms of Service 2026 revisions across footer components.',
        status: 'Closed',
        priority: 'Low',
        project: project._id,
        reporter: adminUser._id,
        assignee: adminUser._id,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ['docs', 'compliance'],
      },
      {
        issueKey: 'BUG-7',
        title: 'Fix Kanban card horizontal clipping on tablet resolution (768px-1024px)',
        description:
          'On iPad viewport widths, the 4-column Kanban layout had overflow-hidden cutting off status pill badges.',
        status: 'Resolved',
        priority: 'Medium',
        project: project._id,
        reporter: devUser._id,
        assignee: devUser._id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tags: ['ui', 'responsive'],
      },
      {
        issueKey: 'BUG-8',
        title: 'Refactor user avatar fallback colors to be deterministically hash-based',
        description:
          'When a user has no uploaded avatar, compute a consistent vibrant background hue from their email string instead of random assignment.',
        status: 'Open',
        priority: 'Low',
        project: project._id,
        reporter: devUser._id,
        assignee: null,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        tags: ['design-system'],
      },
    ];

    const createdIssues = await Issue.insertMany(issuesData);
    console.log(`Created ${createdIssues.length} sample issues.`);

    // 4. Create Comments
    const issue1 = createdIssues[0];
    const issue2 = createdIssues[1];
    const issue3 = createdIssues[2];

    await Comment.create([
      {
        issue: issue1._id,
        author: reporterUser._id,
        body: 'Reproduced on Node v22 runtime with 50 simulated disconnects. Heap snapshot attached in ticket.',
      },
      {
        issue: issue1._id,
        author: devUser._id,
        body: 'Investigating the event emitter listeners on ws.on("close"). Will patch and submit PR shortly.',
      },
      {
        issue: issue2._id,
        author: devUser._id,
        body: 'Google Cloud OAuth credentials updated. Waiting for cache invalidation on the DNS edge.',
      },
      {
        issue: issue3._id,
        author: adminUser._id,
        body: 'Added Redis distributed lock around customerId during webhook processing. Testing in sandbox.',
      },
    ]);
    console.log('Created sample discussions/comments.');

    // 5. Create Activity History
    await Activity.create([
      {
        issue: issue1._id,
        project: project._id,
        actor: reporterUser._id,
        action: 'created',
        details: 'created issue BUG-1: "Memory leak during WebSocket heartbeat reconnection cycle"',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        issue: issue1._id,
        project: project._id,
        actor: adminUser._id,
        action: 'assigned',
        field: 'assignee',
        details: 'assigned issue to Devon Vance',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        issue: issue2._id,
        project: project._id,
        actor: devUser._id,
        action: 'status_changed',
        field: 'status',
        oldValue: 'Open',
        newValue: 'In Progress',
        details: 'moved status from Open to In Progress',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        issue: issue3._id,
        project: project._id,
        actor: adminUser._id,
        action: 'priority_changed',
        field: 'priority',
        oldValue: 'High',
        newValue: 'Critical',
        details: 'changed priority from High to Critical',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log('Created sample activity audit history.');

    console.log('\n===========================================');
    console.log('✅ BUGTRACK DATABASE SEEDING COMPLETE!');
    console.log('===========================================');
    console.log('Demo Logins:');
    console.log('  Admin:     admin@bugtrack.io    / password123');
    console.log('  Developer: dev@bugtrack.io      / password123');
    console.log('  Reporter:  reporter@bugtrack.io / password123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
