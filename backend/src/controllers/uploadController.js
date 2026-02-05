const { authService } = require('../services');
const { success, error } = require('../utils/response');

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    return process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name' &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_KEY !== 'your-api-key';
};

class UploadController {
    /**
     * POST /api/upload/avatar
     */
    async uploadAvatar(req, res) {
        try {
            if (!req.file) {
                return error(res, 'No image uploaded', 400);
            }

            let result;

            if (isCloudinaryConfigured()) {
                // Use Cloudinary
                const { uploadAvatar } = require('../utils/cloudinary');
                result = await uploadAvatar(req.file.buffer);
            } else {
                // Fallback to local storage
                const { uploadAvatarLocal } = require('../utils/localStorage');
                result = await uploadAvatarLocal(req.file.buffer, req.file.originalname);
            }

            // Update user avatar
            await authService.updateProfile(req.user.id, { avatar: result.url });

            return success(res, { url: result.url }, 'Avatar uploaded');
        } catch (err) {
            console.error('Avatar upload error:', err);
            return error(res, err.message || 'Failed to upload avatar', err.status || 500);
        }
    }

    /**
     * POST /api/upload/image
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return error(res, 'No image uploaded', 400);
            }

            let result;

            if (isCloudinaryConfigured()) {
                const { uploadImage } = require('../utils/cloudinary');
                result = await uploadImage(req.file.buffer, 'aiku/uploads');
            } else {
                // Fallback to local storage for general images
                const { uploadAvatarLocal } = require('../utils/localStorage');
                result = await uploadAvatarLocal(req.file.buffer, req.file.originalname);
            }

            return success(res, { url: result.url, publicId: result.publicId || result.filename }, 'Image uploaded');
        } catch (err) {
            console.error('Image upload error:', err);
            return error(res, err.message || 'Failed to upload image', err.status || 500);
        }
    }
}

module.exports = new UploadController();

