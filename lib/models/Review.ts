import mongoose, { Schema, model, models } from "mongoose";

const reviewSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    userName: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    variantLabel: { type: String, default: "" },
    content: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });

export const Review = models.Review || model("Review", reviewSchema);
