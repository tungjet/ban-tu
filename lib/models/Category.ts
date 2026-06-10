import mongoose, { Schema, model, models } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: null },
    description: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ displayOrder: 1 });

export const Category = models.Category || model("Category", categorySchema);
