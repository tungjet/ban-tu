import mongoose, { Schema, model, models } from "mongoose";

const storeSettingsSchema = new Schema(
  {
    singleton: { type: String, default: "default", unique: true },
    phone: { type: String, default: "" },
    zalo: { type: String, default: "" },
    facebook: { type: String, default: "" },
    address: { type: String, default: "" },
    defaultCommissionPercent: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const StoreSettings = models.StoreSettings || model("StoreSettings", storeSettingsSchema);
