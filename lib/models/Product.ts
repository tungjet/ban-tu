import mongoose, { Schema, model, models } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, default: null, unique: true, sparse: true },
    price: { type: mongoose.Schema.Types.Mixed, default: null },
    originalPrice: { type: mongoose.Schema.Types.Mixed, default: null },
    imageUrl: { type: String, default: null },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    features: { type: [String], default: [] },
    rating: { type: Number, default: 5 },
    sold: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    categoryId: { type: String, default: null },
    commissionPercent: { type: Number, default: null },
  },
  { timestamps: true }
);

productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ categoryId: 1 });

export const Product = models.Product || model("Product", productSchema);
