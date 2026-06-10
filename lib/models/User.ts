import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, default: null },
    phone: { type: String, default: null },
    role: { type: String, enum: ["admin", "collaborator", "customer"], default: "customer" },
    status: { type: String, enum: ["pending", "active", "banned"], default: "active" },
    referralCode: { type: String, default: null, unique: true, sparse: true },
    commissionBalance: { type: Number, default: 0 },
    bankName: { type: String, default: null },
    bankAccount: { type: String, default: null },
    bankHolder: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

export const User = models.User || model("User", userSchema);
