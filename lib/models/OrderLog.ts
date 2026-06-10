import mongoose, { Schema, model, models } from "mongoose";

const orderLogSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    orderCode: { type: String, default: null },
    action: {
      type: String,
      enum: ["created", "status_changed", "updated", "deleted", "merged"],
      required: true,
    },
    oldStatus: { type: String, default: null },
    newStatus: { type: String, default: null },
    changedBy: { type: String, default: null },
    changedByEmail: { type: String, default: null },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

orderLogSchema.index({ createdAt: -1 });

export const OrderLog = models.OrderLog || model("OrderLog", orderLogSchema);
