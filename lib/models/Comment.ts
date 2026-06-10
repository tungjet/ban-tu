import mongoose, { Schema, model, models } from "mongoose";

const commentSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    userName: { type: String, default: null },
    content: { type: String, required: true },
    reply: { type: String, default: null },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

commentSchema.index({ productId: 1, createdAt: -1 });

export const Comment = models.Comment || model("Comment", commentSchema);
