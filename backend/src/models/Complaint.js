const mongoose = require('mongoose');
const {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  AI_ANALYSIS_STATUSES,
  CIVIC_CATEGORIES
} = require('../constants');

const statusHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      default: null
    },
    to: {
      type: String,
      required: true,
      enum: Object.values(COMPLAINT_STATUSES)
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const adminNoteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    referenceCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    location: {
      address: {
        type: String,
        required: [true, 'Location address is required'],
        trim: true,
        maxlength: [300, 'Address cannot exceed 300 characters']
      },
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CIVIC_CATEGORIES,
        message: '{VALUE} is not an authorized civic category'
      },
      default: 'Other',
      index: true
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(COMPLAINT_PRIORITIES),
        message: '{VALUE} is not a valid priority'
      },
      default: COMPLAINT_PRIORITIES.MEDIUM,
      index: true
    },
    department: {
      type: String,
      trim: true,
      default: 'Unassigned',
      index: true
    },
    status: {
      type: String,
      enum: {
        values: Object.values(COMPLAINT_STATUSES),
        message: '{VALUE} is not a valid complaint status'
      },
      default: COMPLAINT_STATUSES.SUBMITTED,
      index: true
    },
    image: {
      url: {
        type: String,
        default: null
      },
      storageKey: {
        type: String,
        default: null
      },
      mimeType: {
        type: String,
        default: null
      }
    },
    aiAnalysis: {
      status: {
        type: String,
        enum: Object.values(AI_ANALYSIS_STATUSES),
        default: AI_ANALYSIS_STATUSES.PENDING
      },
      summary: {
        type: String,
        default: ''
      },
      suggestedCategory: {
        type: String,
        default: ''
      },
      suggestedPriority: {
        type: String,
        default: ''
      },
      suggestedDepartment: {
        type: String,
        default: ''
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null
      },
      potentialDuplicates: [
        {
          referenceCode: { type: String, required: true },
          title: { type: String, default: '' },
          similarityReason: { type: String, default: '' },
          confidence: { type: Number, default: null }
        }
      ],
      error: {
        type: String,
        default: null
      },
      analyzedAt: {
        type: Date,
        default: null
      }
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    statusHistory: [statusHistorySchema],
    adminNotes: [adminNoteSchema]
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal admin queue and filtering performance
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ citizenId: 1, createdAt: -1 });

// Helper function to generate clean human-readable reference code: CV-YYYY-XXXXX
complaintSchema.statics.generateReferenceCode = function () {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `CV-${year}-${randomPart}`;
};

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
