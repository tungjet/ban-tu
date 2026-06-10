export type Role = "admin" | "collaborator" | "customer";
export type ProfileStatus = "pending" | "active" | "banned";
export type CommissionType = "order_earned" | "withdrawal" | "adjustment" | "refund";
export type CommissionStatus = "none" | "pending" | "earned" | "cancelled";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  status: ProfileStatus;
  referral_code: string | null;
  commission_balance: number;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  collaborator_id: string;
  order_id: string | null;
  amount: number;
  type: CommissionType;
  note: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  collaborator_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  status: WithdrawalStatus;
  admin_note: string | null;
  processed_by: string | null;
  processed_by_email: string | null;
  processed_at: string | null;
  created_at: string;
}
