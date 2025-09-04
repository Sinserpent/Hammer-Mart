import multer from 'multer';
const storage = multer.memoryStorage(); // important: use memoryStorage
export const upload = multer({ storage });