/**
 * Sanitization Utilities
 * 
 * Provides secure HTML sanitization for user-generated content
 * to prevent XSS attacks while preserving rich-text formatting
 */

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Allowed HTML tags for rich-text content (Tiptap compatible)
 */
const ALLOWED_TAGS = [
    // Text formatting
    'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'sub', 'sup', 'mark', 'code', 'pre',

    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

    // Lists
    'ul', 'ol', 'li',

    // Links
    'a',

    // Blocks
    'blockquote', 'hr', 'div',

    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',

    // Media (controlled)
    'img',
];

/**
 * Allowed attributes per tag
 */
const ALLOWED_ATTRS = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'span': ['style', 'class'],
    'p': ['style', 'class'],
    'div': ['style', 'class'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
    '*': ['class'],
};

/**
 * Allowed CSS properties for inline styles
 */
const ALLOWED_STYLES = [
    'color',
    'background-color',
    'text-align',
    'font-weight',
    'font-style',
    'text-decoration',
];

/**
 * Configure DOMPurify with strict settings
 */
const sanitizeConfig = {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',    // Links
        'src', 'alt', 'width', 'height',      // Images
        'style', 'class',                      // Styling
        'colspan', 'rowspan',                  // Tables
    ],
    ALLOW_DATA_ATTR: false,                   // No data-* attributes
    ALLOW_UNKNOWN_PROTOCOLS: false,           // Only http, https, mailto
    SAFE_FOR_TEMPLATES: true,

    // Hook to sanitize URLs
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

    // Remove dangerous elements entirely
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitize HTML content (for notes, descriptions, etc.)
 * 
 * @param {string} dirty - Untrusted HTML content
 * @returns {string} - Sanitized HTML safe for rendering
 */
const sanitizeHtml = (dirty) => {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    // First pass: DOMPurify sanitization
    let clean = DOMPurify.sanitize(dirty, sanitizeConfig);

    // Second pass: Additional URL validation for links
    clean = clean.replace(
        /href\s*=\s*["']javascript:[^"']*["']/gi,
        'href="#"'
    );

    return clean;
};

/**
 * Sanitize plain text (removes all HTML)
 * For titles, short descriptions, etc.
 * 
 * @param {string} dirty - Untrusted text
 * @returns {string} - Plain text with HTML stripped
 */
const sanitizeText = (dirty) => {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

/**
 * Escape HTML entities (for embedding in attributes)
 * 
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
const escapeHtml = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
};

/**
 * Validate and sanitize URL
 * 
 * @param {string} url - URL to validate
 * @returns {string|null} - Safe URL or null if invalid
 */
const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }

    try {
        const parsed = new URL(url);
        const allowedProtocols = ['http:', 'https:', 'mailto:'];

        if (!allowedProtocols.includes(parsed.protocol)) {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
};

module.exports = {
    sanitizeHtml,
    sanitizeText,
    escapeHtml,
    sanitizeUrl,
    DOMPurify,
};
