import mongoose, { Schema, model, models } from "mongoose";

const orderItemSchema = new Schema(
  {
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    slug: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderCode: { type: String, default: null, unique: true, sparse: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, required: true },
    note: { type: String, default: "" },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "Chưa nhận tiền" },
    paymentNote: { type: String, default: "" },
    paymentProofUrl: { type: String, default: null },
    paymentProofUrls: { type: [String], default: [] },
    paymentReceivedAt: { type: Date, default: null },
    paymentReceivedBy: { type: String, default: null },
    paymentReceivedByEmail: { type: String, default: null },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Chờ xử lý", "Chờ thanh toán", "Đã xác nhận", "Đang giao", "Đã hoàn thành", "Đã huỷ"],
      default: "Chờ xử lý",
    },
    items: [orderItemSchema],
    collaboratorId: { type: String, default: null },
    collaboratorCode: { type: String, default: null },
    commissionAmount: { type: Number, default: null },
    commissionStatus: { type: String, default: "none" },
    createdBy: { type: String, default: null },
    createdByEmail: { type: String, default: null },
    updatedBy: { type: String, default: null },
    updatedByEmail: { type: String, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
    deletedByEmail: { type: String, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ collaboratorId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deletedAt: 1 });

export const Order = models.Order || model("Order", orderSchema);
