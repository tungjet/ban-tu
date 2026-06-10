import mongoose, { Schema, model, models } from "mongoose";

const withdrawalSchema = new Schema(
  {
    collaboratorId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    bankName: { type: String, required: true },
    bankAccount: { type: String, required: true },
    bankHolder: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    adminNote: { type: String, default: null },
    processedBy: { type: String, default: null },
    processedByEmail: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ status: 1, createdAt: -1 });

export const Withdrawal = models.Withdrawal || model("Withdrawal", withdrawalSchema);
