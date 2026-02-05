const cloudinary = require('../config/cloudinary');

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - The folder to upload to
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (fileBuffer, folder = 'aiku') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' },
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Upload avatar image with specific transformations
 * @param {Buffer} fileBuffer - The file buffer
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadAvatar = async (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'aiku/avatars',
                resource_type: 'image',
                transformation: [
                    { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                    { quality: 'auto:good' },
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, uploadAvatar, deleteImage };
