const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    planType: { 
      type: String, 
      required: true,
      enum: ['Basic', 'School Pro', 'O/L Pro', 'A/L Pro'] 
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    },
    endDate: { 
      type: Date,
      required: true
    },
    paymentId: { 
      type: String 
    },
    orderId: { 
      type: String, 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      default: 'pending', 
      enum: ['pending', 'success', 'failed', 'canceled', 'chargedback'] 
    }
  },
  { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;