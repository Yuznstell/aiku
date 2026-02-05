const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload avatar to local storage with compression
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - Original filename for extension
 * @returns {Promise<{url: string, filename: string}>}
 */
const uploadAvatarLocal = async (fileBuffer, originalName = 'avatar.jpg') => {
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Compress image using sharp
    // - Resize to max 400x400 for avatars (maintains aspect ratio)
    // - Convert to WebP format for better compression
    // - Quality 80% gives good balance between size and quality
    const compressedBuffer = await sharp(fileBuffer)
        .resize(400, 400, {
            fit: 'cover',
            position: 'center'
        })
        .webp({ quality: 80 })
        .toBuffer();

    await fs.promises.writeFile(filepath, compressedBuffer);

    // Log compression stats
    const originalSize = fileBuffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log(`Avatar compressed: ${(originalSize / 1024).toFixed(1)}KB -> ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

    // Return URL relative to server
    const url = `/uploads/avatars/${filename}`;

    return { url, filename };
};

/**
 * Delete avatar from local storage
 * @param {string} filename - The filename to delete
 */
const deleteAvatarLocal = async (filename) => {
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
    }
};

module.exports = { uploadAvatarLocal, deleteAvatarLocal };
