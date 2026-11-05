const mongoose = require('mongoose');

const revokedTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      default: 'LOGOUT'
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // MongoDB TTL index to auto-delete after expiration
    }
  },
  {
    timestamps: true
  }
);

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);

module.exports = RevokedToken;
