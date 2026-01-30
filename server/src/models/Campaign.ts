import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  subject: string;
  htmlBody: string;
  websiteUrl?: string;
  logoUrl?: string;
  createdAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    websiteUrl: { type: String },
    logoUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
