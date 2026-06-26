import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'txt']);
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  },
});

export const resumeUploadMiddleware = upload.single('resume');

export function handleResumeUploadError(err, _req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 5 MB.',
      });
    }
    return res.status(400).json({ success: false, message: 'Invalid file upload.' });
  }

  if (err.message?.includes('Only PDF')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  return next(err);
}
