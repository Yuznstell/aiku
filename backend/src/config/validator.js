/**
 * Configuration Validator
 * 
 * Validates required environment variables at startup
 * Fails fast if critical security configs are missing
 */

class ConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validate all required configurations
     * Called at application startup
     */
    validate() {
        this.validateJWTSecrets();
        this.validateDatabaseConfig();
        this.validateSecurityConfig();

        if (this.errors.length > 0) {
            console.error('\n❌ CONFIGURATION ERRORS - APPLICATION CANNOT START\n');
            this.errors.forEach((err, i) => {
                console.error(`  ${i + 1}. ${err}`);
            });
            console.error('\n');
            process.exit(1);
        }

        if (this.warnings.length > 0) {
            console.warn('\n⚠️  CONFIGURATION WARNINGS\n');
            this.warnings.forEach((warn, i) => {
                console.warn(`  ${i + 1}. ${warn}`);
            });
            console.warn('\n');
        }

        console.log('✅ Configuration validated successfully');
        return true;
    }

    /**
     * Validate JWT secrets - CRITICAL
     */
    validateJWTSecrets() {
        // JWT_SECRET is required
        if (!process.env.JWT_SECRET) {
            this.errors.push('JWT_SECRET is required but not set');
        } else if (process.env.JWT_SECRET.length < 32) {
            this.errors.push('JWT_SECRET must be at least 32 characters');
        } else if (process.env.JWT_SECRET.includes('default') ||
            process.env.JWT_SECRET.includes('secret') ||
            process.env.JWT_SECRET.includes('123')) {
            this.warnings.push('JWT_SECRET appears to use a weak pattern');
        }

        // JWT_REFRESH_SECRET is required
        if (!process.env.JWT_REFRESH_SECRET) {
            this.errors.push('JWT_REFRESH_SECRET is required but not set');
        } else if (process.env.JWT_REFRESH_SECRET.length < 32) {
            this.errors.push('JWT_REFRESH_SECRET must be at least 32 characters');
        }

        // Secrets should be different
        if (process.env.JWT_SECRET &&
            process.env.JWT_REFRESH_SECRET &&
            process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
            this.errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
        }
    }

    /**
     * Validate database configuration
     */
    validateDatabaseConfig() {
        if (!process.env.DATABASE_URL) {
            this.errors.push('DATABASE_URL is required but not set');
        }
    }

    /**
     * Validate security-related configurations
     */
    validateSecurityConfig() {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            // Production-only validations
            if (!process.env.FRONTEND_URL) {
                this.errors.push('FRONTEND_URL is required in production');
            }

            if (!process.env.FRONTEND_URL?.startsWith('https://')) {
                this.warnings.push('FRONTEND_URL should use HTTPS in production');
            }
        }

        // Cloudinary (optional but warn if missing)
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            this.warnings.push('Cloudinary configuration incomplete - file uploads may fail');
        }

        // SMTP (optional but warn if missing)
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            this.warnings.push('SMTP configuration incomplete - email notifications disabled');
        }
    }
}

// Singleton instance
const configValidator = new ConfigValidator();

module.exports = configValidator;
