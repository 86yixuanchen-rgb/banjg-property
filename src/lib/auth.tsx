import { useClerk, useUser } from "@clerk/tanstack-react-start";

export type SessionUser = {
  name: string;
  email: string;
};

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const sessionUser: SessionUser | null = user
    ? {
        name:
          user.fullName ??
          user.firstName ??
          user.primaryEmailAddress?.emailAddress?.split("@")[0] ??
          "User",
        email: user.primaryEmailAddress?.emailAddress ?? "",
      }
    : null;

  return {
    user: sessionUser,
    ready: isLoaded,
    signOut: () => void clerkSignOut(),
  };
}
