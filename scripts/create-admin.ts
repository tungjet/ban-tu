import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { User } from "../lib/models/User";

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const fullName = args[2] || "Admin";
  const phone = args[3] || "0900000000";

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [fullName] [phone]");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Password phải tối thiểu 6 ký tự");
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`User ${email} đã tồn tại. Updating role/status to admin/active.`);
    existing.role = "admin";
    existing.status = "active";
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
    console.log("Done. User updated.");
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName,
      phone,
      role: "admin",
      status: "active",
      commissionBalance: 0,
    });
    console.log(`Admin user ${email} created.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
