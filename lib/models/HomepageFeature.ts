import mongoose, { Schema, model, models } from "mongoose";

const featureSchema = new Schema(
  {
    icon: { type: String, default: "shield" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    colorTheme: { type: String, default: "blue" },
    displayOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HomepageFeature = models.HomepageFeature || model("HomepageFeature", featureSchema);
