import CredentialsProvider from "next-auth/providers/credentials";

interface AuthOrg { id: number; name: string; slug: string }
interface AuthToken { sub?: string; role?: string; organizationId?: number; organization?: AuthOrg; [key: string]: unknown }
interface AuthUser { role?: string; organizationId?: number; organization?: AuthOrg }
interface AuthSession { user: { id: string; role: string; organizationId: number; organization: AuthOrg; [key: string]: unknown }; [key: string]: unknown }

// Mock users for tech demo - any email/password combination works
const mockUsers = [
  {
    id: "1",
    email: "admin@apollotms.com",
    firstName: "Apollo",
    lastName: "Admin",
    role: "admin",
    organizationId: 1,
    isActive: true,
    organization: {
      id: 1,
      name: "Apollo TMS",
      slug: "apollo-tms",
    },
  },
  {
    id: "2",
    email: "dispatcher@apollotms.com",
    firstName: "Demo",
    lastName: "Dispatcher",
    role: "dispatcher",
    organizationId: 1,
    isActive: true,
    organization: {
      id: 1,
      name: "Apollo TMS",
      slug: "apollo-tms",
    },
  },
  {
    id: "3",
    email: "demo@apollotms.com",
    firstName: "Demo",
    lastName: "User",
    role: "admin",
    organizationId: 1,
    isActive: true,
    organization: {
      id: 1,
      name: "Apollo TMS",
      slug: "apollo-tms",
    },
  },
];

const authConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // For tech demo: any email/password combination works
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        console.log("Demo: Auth attempt for:", credentials.email);

        try {
          // Find user by email or use default demo user
          let user = mockUsers.find(u => u.email.toLowerCase() === credentials.email?.toLowerCase());

          // If no specific user found, create a generic demo user
          if (!user) {
            user = {
              id: "999",
              email: credentials.email,
              firstName: "Demo",
              lastName: "User",
              role: "admin",
              organizationId: 1,
              isActive: true,
              organization: {
                id: 1,
                name: "Apollo TMS",
                slug: "apollo-tms",
              },
            };
          }

          // For tech demo: accept any password
          console.log("Demo: Login successful for:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            organizationId: user.organizationId,
            organization: user.organization,
          };
        } catch (error) {
          console.error("Demo auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: AuthToken; user: AuthUser | undefined }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organization = user.organization;
      }
      return token;
    },
    async session({ session, token }: { session: AuthSession; token: AuthToken }) {
      session.user.id = token.sub!;
      session.user.role = token.role as string;
      session.user.organizationId = token.organizationId as number;
      session.user.organization = token.organization!;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

export default authConfig;