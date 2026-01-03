import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  pathToCV: { type: String, required: true },
  pathToCoverLetter: { type: String, required: true },
  preferred: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Career', careerSchema);


