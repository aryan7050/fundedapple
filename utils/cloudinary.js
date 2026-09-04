import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
});
export function isCloudinaryConfigured() {
    return Boolean(config.cloudinaryCloudName?.trim() &&
        config.cloudinaryApiKey?.trim() &&
        config.cloudinaryApiSecret?.trim());
}
export function uploadImageBuffer(buffer, folder = 'fundedapple/kyc') {
    if (!buffer?.length) {
        return Promise.reject(new Error('Empty image file'));
    }
    if (!isCloudinaryConfigured()) {
        return Promise.reject(new Error('Cloudinary is not configured on the server'));
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            folder,
            resource_type: 'image',
            unique_filename: true,
            overwrite: false,
            transformation: [
                { width: 1600, height: 1600, crop: 'limit', quality: 'auto' },
            ],
        }, (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error);
                reject(new Error(error.message || 'Cloudinary upload failed'));
                return;
            }
            if (!result?.secure_url) {
                reject(new Error('Cloudinary returned no secure URL'));
                return;
            }
            resolve(result.secure_url);
        });
        stream.on('error', (error) => {
            console.error('Cloudinary upload stream error:', error);
            reject(error instanceof Error ? error : new Error('Cloudinary upload stream failed'));
        });
        stream.end(buffer);
    });
}
