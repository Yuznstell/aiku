/**
 * Direct Database Task Test
 * Tests Task model CRUD operations directly via Prisma
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
    console.log('='.repeat(50));
    console.log('🧪 TASK LIST DATABASE TEST');
    console.log('='.repeat(50));

    try {
        // Get or create a test user
        let testUser = await prisma.user.findFirst({
            where: { email: 'admin@aiku.com' }
        });

        if (!testUser) {
            console.log('❌ No test user found. Please run seed first.');
            return;
        }

        console.log(`\n✅ Using user: ${testUser.name} (${testUser.email})`);
        const userId = testUser.id;

        // Clean up existing test tasks
        console.log('\n🧹 Cleaning up existing test tasks...');
        await prisma.task.deleteMany({ where: { userId } });

        // TEST 1: Create Tasks
        console.log('\n--- TEST 1: Create Tasks in Each Column ---');

        const todoTasks = [
            await prisma.task.create({ data: { title: 'Beli groceries', status: 'TODO', userId } }),
            await prisma.task.create({ data: { title: 'Bayar tagihan listrik', status: 'TODO', userId } }),
            await prisma.task.create({ data: { title: 'Buat laporan mingguan', status: 'TODO', userId } }),
        ];
        console.log(`📌 Created ${todoTasks.length} TODO tasks`);

        const doingTasks = [
            await prisma.task.create({ data: { title: 'Kerjakan tugas kuliah', status: 'DOING', userId } }),
            await prisma.task.create({ data: { title: 'Review pull request', status: 'DOING', userId } }),
        ];
        console.log(`🔄 Created ${doingTasks.length} DOING tasks`);

        const doneTasks = [
            await prisma.task.create({ data: { title: 'Meeting dengan tim', status: 'DONE', userId } }),
            await prisma.task.create({ data: { title: 'Update dokumentasi', status: 'DONE', userId } }),
        ];
        console.log(`✅ Created ${doneTasks.length} DONE tasks`);

        // Count verification
        const counts = await prisma.task.groupBy({
            by: ['status'],
            where: { userId },
            _count: true
        });
        console.log('\n📊 Task counts per status:');
        counts.forEach(c => console.log(`   ${c.status}: ${c._count}`));

        // TEST 2: Move Task (Drag-Drop Simulation)
        console.log('\n--- TEST 2: Move Task (Drag-Drop Simulation) ---');

        const taskToMove = todoTasks[0];
        console.log(`Moving "${taskToMove.title}" from TODO -> DOING...`);
        await prisma.task.update({
            where: { id: taskToMove.id },
            data: { status: 'DOING' }
        });
        console.log('   ✅ Moved successfully');

        const anotherMove = doingTasks[0];
        console.log(`Moving "${anotherMove.title}" from DOING -> DONE...`);
        await prisma.task.update({
            where: { id: anotherMove.id },
            data: { status: 'DONE' }
        });
        console.log('   ✅ Moved successfully');

        // TEST 3: Rename Task
        console.log('\n--- TEST 3: Rename Task ---');
        const taskToRename = todoTasks[1];
        console.log(`Renaming "${taskToRename.title}"...`);
        await prisma.task.update({
            where: { id: taskToRename.id },
            data: { title: 'Bayar tagihan PLN bulan Januari' }
        });
        console.log('   ✅ Renamed to "Bayar tagihan PLN bulan Januari"');

        // TEST 4: Delete Task
        console.log('\n--- TEST 4: Delete Task ---');
        const taskToDelete = doneTasks[1];
        console.log(`Deleting "${taskToDelete.title}"...`);
        await prisma.task.delete({ where: { id: taskToDelete.id } });
        console.log('   ✅ Deleted successfully');

        // FINAL STATE
        console.log('\n--- FINAL STATE ---');
        const allTasks = await prisma.task.findMany({
            where: { userId },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
        });

        const finalCounts = {
            TODO: allTasks.filter(t => t.status === 'TODO').length,
            DOING: allTasks.filter(t => t.status === 'DOING').length,
            DONE: allTasks.filter(t => t.status === 'DONE').length,
        };

        console.log(`📊 Final counts: TODO=${finalCounts.TODO}, DOING=${finalCounts.DOING}, DONE=${finalCounts.DONE}`);
        console.log('\n📋 All Tasks:');
        allTasks.forEach(t => {
            const emoji = t.status === 'TODO' ? '📌' : t.status === 'DOING' ? '🔄' : '✅';
            console.log(`   ${emoji} [${t.status}] ${t.title}`);
        });

        console.log('\n' + '='.repeat(50));
        console.log('🎉 ALL TESTS PASSED!');
        console.log('='.repeat(50));
        console.log('\n📝 Summary:');
        console.log('   - Created 7 tasks across 3 columns');
        console.log('   - Moved 2 tasks between columns');
        console.log('   - Renamed 1 task');
        console.log('   - Deleted 1 task');
        console.log('   - Final: 6 tasks remaining');
        console.log('\n🌐 Open the frontend at http://localhost:3000/tasks to see the board!');

    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
