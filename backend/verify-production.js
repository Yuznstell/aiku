/**
 * Production Readiness Verification Script
 * 
 * Run this script to verify all security fixes are properly applied
 * before deploying to production.
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('AIKU PRODUCTION READINESS VERIFICATION');
console.log('='.repeat(70));
console.log('');

const checks = [
    {
        name: 'C01: Cookie-based auth',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/config/cookies.js'), 'utf8');
            return code.includes('httpOnly: true') && code.includes('sameSite');
        }
    },
    {
        name: 'C02: Socket.IO validation',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/socket/index.js'), 'utf8');
            return code.includes('prisma.friendship.findFirst') && code.includes('PENDING');
        }
    },
    {
        name: 'C03: JWT secret validation',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/config/validator.js'), 'utf8');
            return code.includes('JWT_SECRET') && code.includes('process.exit(1)');
        }
    },
    {
        name: 'H07: XSS sanitization',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/utils/sanitize.js'), 'utf8');
            return code.includes('DOMPurify') && code.includes('FORBID_TAGS');
        }
    },
    {
        name: 'H07: Notes use sanitization',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/services/noteService.js'), 'utf8');
            return code.includes('sanitizeHtml') && code.includes('sanitizeText');
        }
    },
    {
        name: 'H02: Reminder permission check',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/services/reminderService.js'), 'utf8');
            return code.includes('VIEWER') && code.includes('permission');
        }
    },
    {
        name: 'H04: Blocked user check',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/services/chatService.js'), 'utf8');
            return code.includes('areFriendsAndNotBlocked');
        }
    },
    {
        name: 'H06: Online status privacy',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/socket/index.js'), 'utf8');
            return code.includes('getUserFriendIds') || code.includes('friendIds');
        }
    },
    {
        name: 'M01: Socket rate limiting',
        check: () => {
            return fs.existsSync(path.join(__dirname, 'src/middleware/socketRateLimit.js'));
        }
    },
    {
        name: 'App: Helmet security headers',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/app.js'), 'utf8');
            return code.includes('helmet');
        }
    },
    {
        name: 'App: CORS configured',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/app.js'), 'utf8');
            return code.includes('cors') && code.includes('credentials: true');
        }
    },
    {
        name: 'App: Cookie parser',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/app.js'), 'utf8');
            return code.includes('cookieParser');
        }
    },
    {
        name: 'App: Config validator at startup',
        check: () => {
            const code = fs.readFileSync(path.join(__dirname, 'src/app.js'), 'utf8');
            return code.includes('configValidator.validate()');
        }
    },
    {
        name: 'Deps: DOMPurify installed',
        check: () => {
            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            return !!pkg.dependencies.dompurify;
        }
    },
    {
        name: 'Deps: cookie-parser installed',
        check: () => {
            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            return !!pkg.dependencies['cookie-parser'];
        }
    }
];

let passed = 0;
let failed = 0;

console.log('| # | Check                           | Status   |');
console.log('|---|--------------------------------|----------|');

checks.forEach((check, i) => {
    try {
        const result = check.check();
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`| ${(i + 1).toString().padStart(1)} | ${check.name.padEnd(30)} | ${status} |`);
        if (result) passed++; else failed++;
    } catch (err) {
        console.log(`| ${(i + 1).toString().padStart(1)} | ${check.name.padEnd(30)} | ❓ ERROR |`);
        failed++;
    }
});

console.log('');
console.log('='.repeat(70));
console.log(`RESULT: ${passed}/${checks.length} checks passed, ${failed} failed`);
console.log('='.repeat(70));

if (failed === 0) {
    console.log('');
    console.log('✅ ALL CHECKS PASSED - READY FOR PRODUCTION');
    console.log('');
    process.exit(0);
} else {
    console.log('');
    console.log('❌ SOME CHECKS FAILED - DO NOT DEPLOY');
    console.log('');
    process.exit(1);
}
