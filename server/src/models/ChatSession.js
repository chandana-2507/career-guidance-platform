import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New conversation',
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true },
);

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
