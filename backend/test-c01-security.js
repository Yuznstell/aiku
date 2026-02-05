/**
 * C01 Security Test - httpOnly Cookie Verification
 * 
 * This script tests that JWT tokens are properly set in httpOnly cookies
 * and cannot be accessed via JavaScript (simulating XSS protection)
 */

const http = require('http');

const API_URL = 'http://localhost:5029';

// Test credentials
const testUser = {
    email: 'admin@aiku.com',
    password: 'admin123'
};

console.log('='.repeat(60));
console.log('C01 SECURITY TEST: httpOnly Cookie Verification');
console.log('='.repeat(60));
console.log('');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, cookies = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (cookies) {
            options.headers['Cookie'] = cookies;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data ? JSON.parse(data) : null
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    try {
        // TEST 1: Login and check Set-Cookie headers
        console.log('TEST 1: Login Request - Checking Set-Cookie Headers');
        console.log('-'.repeat(60));

        const loginResponse = await makeRequest('POST', '/api/auth/login', testUser);

        console.log('Status:', loginResponse.status);
        console.log('');

        const setCookieHeaders = loginResponse.headers['set-cookie'] || [];
        console.log('Set-Cookie Headers Found:', setCookieHeaders.length);
        console.log('');

        let accessTokenCookie = null;
        let refreshTokenCookie = null;

        setCookieHeaders.forEach((cookie, index) => {
            console.log(`Cookie ${index + 1}:`, cookie.substring(0, 80) + '...');

            // Parse cookie attributes
            const hasHttpOnly = cookie.toLowerCase().includes('httponly');
            const hasSameSite = cookie.toLowerCase().includes('samesite=strict');
            const isAccessToken = cookie.startsWith('accessToken=');
            const isRefreshToken = cookie.startsWith('refreshToken=');

            if (isAccessToken) accessTokenCookie = cookie;
            if (isRefreshToken) refreshTokenCookie = cookie;

            console.log('  - HttpOnly:', hasHttpOnly ? '✅ YES' : '❌ NO (VULNERABLE!)');
            console.log('  - SameSite=Strict:', hasSameSite ? '✅ YES' : '⚠️  Missing');
            console.log('');
        });

        // TEST 2: Verify httpOnly flag blocks JavaScript access simulation
        console.log('TEST 2: Simulating JavaScript Access Attempt');
        console.log('-'.repeat(60));

        if (accessTokenCookie && accessTokenCookie.toLowerCase().includes('httponly')) {
            console.log('RESULT: ✅ PASS - Token has httpOnly flag');
            console.log('');
            console.log('Simulation:');
            console.log('  Browser Console: document.cookie');
            console.log('  Expected Output: "" (empty - accessToken not visible)');
            console.log('');
            console.log('  Browser Console: localStorage.getItem("accessToken")');
            console.log('  Expected Output: null (not stored in localStorage)');
        } else {
            console.log('RESULT: ❌ FAIL - Token does NOT have httpOnly flag!');
            console.log('XSS attacks could steal tokens!');
        }
        console.log('');

        // TEST 3: Verify cookie-based authentication works
        console.log('TEST 3: Cookie-Based Authentication');
        console.log('-'.repeat(60));

        // Extract just the cookie value for the request
        const cookieString = setCookieHeaders.map(c => c.split(';')[0]).join('; ');

        const profileResponse = await makeRequest('GET', '/api/auth/profile', null, cookieString);

        if (profileResponse.status === 200) {
            console.log('RESULT: ✅ PASS - Authenticated successfully using cookies');
            console.log('User:', profileResponse.body.data?.email || 'N/A');
        } else {
            console.log('RESULT: ⚠️  Status', profileResponse.status);
            console.log('Response:', JSON.stringify(profileResponse.body));
        }
        console.log('');

        // SUMMARY
        console.log('='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));

        const hasHttpOnly = accessTokenCookie?.toLowerCase().includes('httponly');
        const hasSameSite = accessTokenCookie?.toLowerCase().includes('samesite');

        console.log('');
        console.log('| Check                  | Status |');
        console.log('|------------------------|--------|');
        console.log(`| httpOnly Flag          | ${hasHttpOnly ? '✅ PASS' : '❌ FAIL'} |`);
        console.log(`| SameSite Protection    | ${hasSameSite ? '✅ PASS' : '⚠️ WARN'} |`);
        console.log(`| Cookie Auth Works      | ${profileResponse.status === 200 ? '✅ PASS' : '❌ FAIL'} |`);
        console.log('');

        if (hasHttpOnly) {
            console.log('✅ C01 FIX VERIFIED: Tokens are protected from XSS attacks');
        } else {
            console.log('❌ C01 FIX FAILED: Tokens are still vulnerable to XSS!');
        }

    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

runTests();
