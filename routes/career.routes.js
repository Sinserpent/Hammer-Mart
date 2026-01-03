
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import Career from '../models/career.model.js';

const router = express.Router();

const uploadDir = path.resolve(process.env.HOME, 'Final_HammerBidMart/careerUploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer Config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const newId = req.generatedId || new mongoose.Types.ObjectId().toString();
    req.generatedId = newId;
    const ext = path.extname(file.originalname);
    const isCoverLetter = file.fieldname === 'coverLetter';
    const filename = isCoverLetter ? `${newId}L${ext}` : `${newId}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// === POST /submit ===
export const submitCV = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const files = req.files;
    if (!files?.CV?.[0] || !files?.coverLetter?.[0] || !fullName || !email)
      return res.status(400).json({ error: 'Missing required fields or files.' });

    const newId = req.generatedId;
    const newCareer = new Career({
      _id: newId,
      fullName,
      email,
      pathToCV: files.CV[0].filename,
      pathToCoverLetter: files.coverLetter[0].filename,
    });

    await newCareer.save();
    return res.status(201).json({
      message: 'CV and Cover Letter submitted successfully.',
      CVID: newCareer._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// === GET /getallCV ===
export const getallCV = async (req, res) => {
  try {
    const allCVs = await Career.find(
      {},
      { fullName: 1, email: 1, pathToCV: 1, pathToCoverLetter: 1, preferred: 1 }
    ).sort({ preferred: -1 }); // ⭐ true (1) first, false (0) later

    return res.json(allCVs);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch CVs' });
  }
};

// === GET /getCV?id=xxxxx ===
export const getCVbyId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing ID parameter' });

    const record = await Career.findById(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const cvPath = path.join(uploadDir, record.pathToCV);
    const coverPath = path.join(uploadDir, record.pathToCoverLetter);

    if (!fs.existsSync(cvPath) || !fs.existsSync(coverPath))
      return res.status(404).json({ error: 'One or both files missing on disk' });

    const zipName = `${record.fullName.replace(/\s+/g, '_')}_Documents.zip`;

    // Create archive safely
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    archive.pipe(res);

    archive.file(cvPath, { name: `${record.fullName}_CV${path.extname(cvPath)}` });
    archive.file(coverPath, { name: `${record.fullName}_CoverLetter${path.extname(coverPath)}` });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) res.status(500).end();
    });

    archive.finalize().catch((err) => {
      console.error('Finalize error:', err);
      if (!res.headersSent) res.status(500).end();
    });
  } catch (err) {
    console.error('Fetch error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to fetch CV and Cover Letter' });
  }
};

export const togglePreferred = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });

    const record = await Career.findById(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    // Toggle the value
    const updated = await Career.findByIdAndUpdate(
      id,
      { preferred: !record.preferred },
      { new: true, runValidators: false }
    );

    return res.json({
      message: `Preferred status updated to ${updated.preferred}`,
      preferred: updated.preferred,
      id: updated._id,
    });
  } catch (err) {
    console.error('Toggle Preferred Error:', err);
    return res.status(500).json({ error: 'Failed to toggle preferred status' });
  }
};

// === Routes ===
router.post(
  '/submit',
  upload.fields([
    { name: 'CV', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 },
  ]),
  submitCV
);
router.get('/getallCV', getallCV);
router.get('/getCV/:id', getCVbyId);
router.put('/togglePreferred/:id', togglePreferred);

export default router;
