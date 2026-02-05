// Quick test for sanitize.js
const { sanitizeHtml } = require('./src/utils/sanitize');

const tests = [
    { input: '<script>alert(1)</script>', name: 'Script tag' },
    { input: '<img src="x" onerror="alert(1)">', name: 'IMG onerror' },
    { input: '<a href="javascript:alert(1)">Click</a>', name: 'JS URL' },
    { input: '<p>Safe content</p>', name: 'Safe paragraph' },
];

console.log('=== XSS Sanitization Test ===\n');

tests.forEach(t => {
    const output = sanitizeHtml(t.input);
    const hasScript = output.includes('<script');
    const hasOnerror = output.includes('onerror');
    const hasJsUrl = output.includes('javascript:');
    const isDangerous = hasScript || hasOnerror || hasJsUrl;

    console.log(`${t.name}:`);
    console.log(`  INPUT:  ${t.input}`);
    console.log(`  OUTPUT: ${output || '(empty)'}`);
    console.log(`  SAFE:   ${isDangerous ? '❌ NO' : '✅ YES'}`);
    console.log('');
});
