/**
 * Test Calendar Timezone Fix
 * 
 * This test verifies that when a user clicks a specific date (e.g., 24th),
 * the event is saved with that exact date, not the previous day due to UTC conversion.
 */

const API_URL = 'http://localhost:5029/api';

async function testCalendarTimezone() {
    console.log('🧪 Testing Calendar Timezone Fix...\n');

    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@aiku.com',
            password: 'admin123'
        })
    });

    if (!loginRes.ok) {
        console.error('❌ Login failed');
        process.exit(1);
    }

    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('✅ Logged in successfully\n');

    // Step 2: Create event with local time string (simulating frontend fix)
    // This is what the frontend now sends after the fix: "2026-01-24T09:00" (no Z, no offset)
    const testDate = '2026-01-24';  // The date user clicked
    const startTime = `${testDate}T09:00`;  // Local time format (no timezone)
    const endTime = `${testDate}T10:00`;

    console.log('2️⃣ Creating event with local time format...');
    console.log(`   Start Time: ${startTime}`);
    console.log(`   End Time: ${endTime}`);

    const createRes = await fetch(`${API_URL}/calendar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: 'Timezone Test Event',
            description: 'Testing if date is preserved correctly',
            startTime: startTime,
            endTime: endTime,
            color: '#6366f1'
        })
    });

    if (!createRes.ok) {
        const err = await createRes.json();
        console.error('❌ Failed to create event:', err.message);
        process.exit(1);
    }

    const createData = await createRes.json();
    const event = createData.data;
    console.log('✅ Event created successfully\n');

    // Step 3: Verify the saved date
    console.log('3️⃣ Verifying saved date...');
    const savedDate = new Date(event.startTime);
    const savedDateStr = savedDate.toISOString().split('T')[0];
    const savedDay = savedDate.getDate();

    console.log(`   Expected date: ${testDate} (day 24)`);
    console.log(`   Saved startTime: ${event.startTime}`);
    console.log(`   Saved date (local): ${savedDateStr}`);
    console.log(`   Saved day: ${savedDay}`);

    // The critical check: did the date stay as 24th?
    if (savedDay === 24) {
        console.log('\n✅✅✅ TEST PASSED! Date is correctly preserved as 24th ✅✅✅');
        console.log('The timezone bug is FIXED!\n');
    } else {
        console.log(`\n❌❌❌ TEST FAILED! Date shifted to day ${savedDay} instead of 24 ❌❌❌`);
        console.log('The timezone bug still exists!\n');
        process.exit(1);
    }

    // Step 4: Cleanup - delete the test event
    console.log('4️⃣ Cleaning up test event...');
    const deleteRes = await fetch(`${API_URL}/calendar/${event.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (deleteRes.ok) {
        console.log('✅ Test event deleted\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('     CALENDAR TIMEZONE FIX VERIFIED     ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testCalendarTimezone().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
