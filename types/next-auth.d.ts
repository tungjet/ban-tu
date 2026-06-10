import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "admin" | "collaborator" | "customer";
    status: "pending" | "active" | "banned";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: "admin" | "collaborator" | "customer";
      status: "pending" | "active" | "banned";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "collaborator" | "customer";
    status?: "pending" | "active" | "banned";
  }
}
