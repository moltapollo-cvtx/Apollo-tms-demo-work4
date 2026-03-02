import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";

export interface AuthContext {
  userId: number;
  organizationId: number;
  role: string;
  hasSession: boolean;
}

const DEFAULT_AUTH_CONTEXT: AuthContext = {
  userId: 1,
  organizationId: 1,
  role: "admin",
  hasSession: false,
};

const toNumberOr = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

export async function getAuthContext(): Promise<AuthContext> {
  const session = await getServerSession(authConfig);
  const user = session?.user;

  if (!user) {
    return DEFAULT_AUTH_CONTEXT;
  }

  return {
    userId: toNumberOr(user.id, DEFAULT_AUTH_CONTEXT.userId),
    organizationId: toNumberOr(
      user.organizationId,
      DEFAULT_AUTH_CONTEXT.organizationId,
    ),
    role: typeof user.role === "string" ? user.role : DEFAULT_AUTH_CONTEXT.role,
    hasSession: true,
  };
}
