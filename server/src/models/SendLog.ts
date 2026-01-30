import mongoose, { Document, Schema } from 'mongoose';

export interface ISendLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientEmail: string;
  status: 'queued' | 'sent' | 'failed';
  errorMessage?: string;
  resendMessageId?: string;
  sentAt?: Date;
  createdAt: Date;
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
  },
  {
    timestamps: true,
  }
);

sendLogSchema.index({ campaignId: 1 });
sendLogSchema.index({ status: 1 });
sendLogSchema.index({ createdAt: -1 });

export const SendLog = mongoose.model<ISendLog>('SendLog', sendLogSchema);
