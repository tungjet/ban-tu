import { User } from "@/lib/models/User";

export async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate unique referral code after 10 attempts");
}
