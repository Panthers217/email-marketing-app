import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipient extends Document {
  email: string;
  name?: string;
  tags: string[];
  city?: string;
  county?: string;
  time?: string;
  date?: Date;
  subject?: string;
  createdAt: Date;
}

const recipientSchema = new Schema<IRecipient>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String },
    tags: [{ type: String }],
    city: { type: String },
    county: { type: String },
    time: { type: String },
    date: { type: Date },
    subject: { type: String },
  },
  {
    timestamps: true,
  }
);

// Only index tags (email already indexed by unique: true)
recipientSchema.index({ tags: 1 });

export const Recipient = mongoose.model<IRecipient>('Recipient', recipientSchema);
