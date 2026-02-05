const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@aiku.com' },
        update: {},
        create: {
            email: 'admin@aiku.com',
            password: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
            emailVerified: true,
        },
    });
    console.log('Created admin:', admin.email);

    // Create demo users
    const userPassword = await bcrypt.hash('user123', 12);

    const user1 = await prisma.user.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            email: 'john@example.com',
            password: userPassword,
            name: 'John Doe',
            role: 'USER',
            emailVerified: true,
        },
    });
    console.log('Created user:', user1.email);

    const user2 = await prisma.user.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
            email: 'jane@example.com',
            password: userPassword,
            name: 'Jane Smith',
            role: 'USER',
            emailVerified: true,
        },
    });
    console.log('Created user:', user2.email);

    // Create sample notes for John
    const note1 = await prisma.note.create({
        data: {
            title: 'Welcome to AIKU',
            content: '<h1>Welcome to AIKU!</h1><p>This is your first note. You can use the rich text editor to format your notes.</p><p><strong>Features:</strong></p><ul><li>Create and organize notes</li><li>Share notes with friends</li><li>Set reminders</li><li>Manage your calendar</li></ul>',
            userId: user1.id,
            tags: {
                create: [{ name: 'welcome' }, { name: 'getting-started' }],
            },
        },
    });
    console.log('Created note:', note1.title);

    // Create sample reminders
    const reminder1 = await prisma.reminder.create({
        data: {
            title: 'Team Meeting',
            description: 'Weekly sync with the team',
            remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            repeatType: 'WEEKLY',
            userId: user1.id,
        },
    });
    console.log('Created reminder:', reminder1.title);

    // Create sample calendar events
    const event1 = await prisma.calendarEvent.create({
        data: {
            title: 'Project Kickoff',
            description: 'Initial project planning meeting',
            startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            color: '#6366f1',
            userId: user1.id,
        },
    });
    console.log('Created event:', event1.title);

    // Create friendship between users
    await prisma.friendship.create({
        data: {
            requesterId: user1.id,
            addresseeId: user2.id,
            status: 'ACCEPTED',
        },
    });
    console.log('Created friendship between John and Jane');

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
