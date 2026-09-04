import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImageBuffer, isCloudinaryConfigured } from '../utils/cloudinary.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.post(
  '/upload-document',
  requireAuth,
  (req, res, next) => {
    upload.single('document')(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Image is too large. Maximum size is 8 MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${error.message}` });
      }

      if (error) {
        return res.status(400).json({ error: error.message || 'Invalid upload' });
      }

      next();
    });
  },
  async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'Cloudinary is not configured on the backend. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file was received.' });
    }

    const side = req.body?.side;
    if (side !== 'front' && side !== 'back') {
      return res.status(400).json({ error: 'Document side must be front or back.' });
    }

    try {
      const userId = req.user!.id;
      const folder = `fundedapple/kyc/${userId}`;

      console.log(`[KYC] Uploading ${side} document for user ${userId}`);

      const url = await uploadImageBuffer(req.file.buffer, folder);

      const user = await prisma.user.update({
        where: { id: userId },
        data: side === 'front'
          ? { idDocumentFrontUrl: url }
          : { idDocumentBackUrl: url },
        select: {
          idDocumentFrontUrl: true,
          idDocumentBackUrl: true,
        },
      });

      console.log(`[KYC] ${side} document uploaded successfully for user ${userId}`);

      return res.status(200).json({
        success: true,
        side,
        url,
        ...user,
      });
    } catch (error: any) {
      console.error('[KYC] Document upload failed:', error);
      return res.status(500).json({
        error: error?.message || 'Document upload failed.',
      });
    }
  }
);

router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        kycStatus: true,
        dateOfBirth: true,
        addressLine1: true,
        city: true,
        stateProvince: true,
        postalCode: true,
        idDocumentType: true,
        idDocumentNumber: true,
        idDocumentFrontUrl: true,
        idDocumentBackUrl: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycRejectionReason: true,
      },
    });

    return res.json({ kyc: user });
  } catch (error) {
    console.error('[KYC] Status error:', error);
    return res.status(500).json({ error: 'Could not load KYC status.' });
  }
});

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const {
      dateOfBirth,
      addressLine1,
      city,
      stateProvince,
      postalCode,
      idDocumentType,
      idDocumentNumber,
    } = req.body ?? {};

    if (!dateOfBirth || !addressLine1 || !city || !postalCode || !idDocumentType || !idDocumentNumber) {
      return res.status(400).json({ error: 'All KYC fields are required.' });
    }

    const parsedDob = new Date(dateOfBirth);
    if (Number.isNaN(parsedDob.getTime())) {
      return res.status(400).json({ error: 'Please provide a valid date of birth.' });
    }

    const existing = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        idDocumentFrontUrl: true,
        idDocumentBackUrl: true,
      },
    });

    if (!existing?.idDocumentFrontUrl || !existing?.idDocumentBackUrl) {
      return res.status(400).json({
        error: 'Please upload both the front and back photos of your ID before submitting KYC.',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        dateOfBirth: parsedDob,
        addressLine1: String(addressLine1).trim(),
        city: String(city).trim(),
        stateProvince: String(stateProvince ?? '').trim(),
        postalCode: String(postalCode).trim(),
        idDocumentType: String(idDocumentType).trim(),
        idDocumentNumber: String(idDocumentNumber).trim(),
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
      select: {
        kycStatus: true,
        kycSubmittedAt: true,
      },
    });

    return res.status(201).json({ kyc: user });
  } catch (error: any) {
    console.error('[KYC] Submit error:', error);
    return res.status(500).json({ error: error?.message || 'Could not submit KYC.' });
  }
});

export default router;
