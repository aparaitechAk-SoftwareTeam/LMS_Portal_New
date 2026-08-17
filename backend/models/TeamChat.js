const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const teamMessageSchema = new mongoose.Schema({
  team:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  channel: { type: String, default: 'general' },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type:    { type: String, enum: ['text','file','image','system','announcement'], default: 'text' },
  attachments: [{
    name: String, url: String, size: Number,
    mimeType: String, publicId: String
  }],
  reactions: [reactionSchema],
  replyTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMessage' },
  edited:    { type: Boolean, default: false },
  editedAt:  Date,
  deletedAt: Date,
  isPinned:  { type: Boolean, default: false },
}, { timestamps: true });

teamMessageSchema.index({ team: 1, channel: 1, createdAt: -1 });

const teamChannelSchema = new mongoose.Schema({
  team:        { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  name:        { type: String, required: true },
  description: String,
  type:        { type: String, enum: ['text','announcement'], default: 'text' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault:   { type: Boolean, default: false },
  isLocked:    { type: Boolean, default: false }, // only admin can post when true
}, { timestamps: true });

module.exports = {
  TeamMessage: mongoose.model('TeamMessage', teamMessageSchema),
  TeamChannel: mongoose.model('TeamChannel', teamChannelSchema),
};
