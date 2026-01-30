import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceSettings extends Document {
  companyName: string;
  senderName: string;
  senderEmail: string;
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
