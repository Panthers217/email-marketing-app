import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceSettings extends Document {
  companyName: string;
  senderName: string;
  senderEmail: string;
  logoUrl?: string;
  websiteUrl?: string;
  encryptedResendApiKey?: string;
  encryptedMongoUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSettingsSchema = new Schema<IWorkspaceSettings>(
  {
    companyName: { type: String, required: true },
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    logoUrl: { type: String },
    websiteUrl: { type: String },
    encryptedResendApiKey: { type: String },
    encryptedMongoUri: { type: String },
  },
  {
    timestamps: true,
  }
);

export const WorkspaceSettings = mongoose.model<IWorkspaceSettings>(
  'WorkspaceSettings',
  workspaceSettingsSchema
);
