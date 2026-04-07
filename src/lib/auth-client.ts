/**
 * Better Auth — React client
 *
 * Client-side auth for React components (TanStack Start).
 * Provides signIn, signUp, signOut, forgetPassword, resetPassword, etc.
 * The tanstackStartCookies plugin handles cookie management automatically.
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
