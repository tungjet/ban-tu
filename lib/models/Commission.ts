import mongoose, { Schema, model, models } from "mongoose";

const commissionSchema = new Schema(
  {
    collaboratorId: { type: String, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["order_earned", "withdrawal", "adjustment", "refund"],
      required: true,
    },
    note: { type: String, default: null },
    createdBy: { type: String, default: null },
    createdByEmail: { type: String, default: null },
  },
  { timestamps: true }
);

commissionSchema.index({ collaboratorId: 1, createdAt: -1 });

export const Commission = models.Commission || model("Commission", commissionSchema);
