import mongoose from 'mongoose';

const LinkProcessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  references: [
    {
      ipAddress: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        default: 0
      },
      hashes: [String] // note: plural 'hashes' must match controller
    }
  ]
});

export default mongoose.models.LinkProcess ||
  mongoose.model('LinkProcess', LinkProcessSchema);
