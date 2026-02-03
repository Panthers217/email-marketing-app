import mongoose, { Document, Schema } from 'mongoose';
import { IRecipient } from './Recipient';
import { ICampaign } from './Campaign';

export interface ISendLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientEmail: string;
  status: 'queued' | 'sent' | 'failed';
  errorMessage?: string;
  resendMessageId?: string;
  sentAt?: Date;
  // Webhook tracking fields
  deliveryStatus?: 'delivered' | 'bounced' | 'complained';
  deliveredAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  complainedAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  webhookEvents?: Array<{
    type: string;
    timestamp: Date;
    data?: any;
  }>;
  createdAt: Date;
}

// Interface for populated SendLog
export interface IPopulatedSendLog extends Omit<ISendLog, 'campaignId' | 'recipientId'> {
  campaignId: ICampaign;
  recipientId: IRecipient;
}

const sendLogSchema = new Schema<ISendLog>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'Recipient', required: true },
    recipientEmail: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed'],
      default: 'queued',
      required: true,
    },
    errorMessage: { type: String },
    resendMessageId: { type: String },
    sentAt: { type: Date },
    // Webhook tracking fields
    deliveryStatus: {
      type: String,
      enum: ['delivered', 'bounced', 'complained'],
    },
    deliveredAt: { type: Date },
    bouncedAt: { type: Date },
    bounceReason: { type: String },
    complainedAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    webhookEvents: [{
      type: { type: String },
      timestamp: { type: Date },
      data: { type: Schema.Types.Mixed },
    }],
  },
  {
    timestamps: true,
  }
);

sendLogSchema.index({ campaignId: 1 });
sendLogSchema.index({ status: 1 });
sendLogSchema.index({ resendMessageId: 1 }); // Index for webhook lookups
sendLogSchema.index({ createdAt: -1 });

export const SendLog = mongoose.model<ISendLog>('SendLog', sendLogSchema);
