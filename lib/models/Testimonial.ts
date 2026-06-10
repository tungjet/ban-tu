import mongoose, { Schema, model, models } from "mongoose";

const testimonialSchema = new Schema(
  {
    customerName: { type: String, required: true },
    initial: { type: String, default: "" },
    productLabel: { type: String, default: "" },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    content: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Testimonial = models.Testimonial || model("Testimonial", testimonialSchema);
