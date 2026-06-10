import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Commission } from "@/lib/models/Commission";
import { requireCollaborator, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  await connectDB();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [thisMonth, earnedRows] = await Promise.all([
    Order.countDocuments({
      collaboratorId: session.id,
      createdAt: { $gte: startOfMonth },
    }),
    Commission.find({
      collaboratorId: session.id,
      type: "order_earned",
    }).lean(),
  ]);

  const totalEarned = earnedRows.reduce((s, r) => s + Number(r.amount), 0);
  return NextResponse.json({ thisMonth, totalEarned });
}
