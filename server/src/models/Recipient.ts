import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipient extends Document {
  email: string;
  name?: string;
  tags: string[];
  createdAt: Date;
}

const recipientSchema = new Schema<IRecipient>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

recipientSchema.index({ email: 1 });
recipientSchema.index({ tags: 1 });

export const Recipient = mongoose.model<IRecipient>('Recipient', recipientSchema);
