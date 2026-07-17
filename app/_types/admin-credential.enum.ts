// Utility to check if user has 'center' permission
import type { AdminCredential } from "@/app/lib/storeHooks/useAdminCredentials";

export function canAccessCenterPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some((c) => c.credential === "center" && c.enabled);
}

export function canAccessFundraiserPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some((c) => c.credential === "fundraiser" && c.enabled);
}

export function canAccessDonationsPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some((c) => c.credential === "donation" && c.enabled);
}

export function canAccessAmbassadorManagementPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some(
    (c) => c.credential === "ambassador_management" && c.enabled,
  );
}

export function canAccessContactUsManagementPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some(
    (c) => c.credential === "contact_us_management" && c.enabled,
  );
}

export function canAccessUserManagementPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some(
    (c) => c.credential === "user_management" && c.enabled,
  );
}

export function canAccessNewsletterManagementPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some(
    (c) => c.credential === "newsletter_management" && c.enabled,
  );
}

export function canAccessDonorManagementPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some(
    (c) => c.credential === "donor_management" && c.enabled,
  );
}

export function canAccessFilesCredentialPermission(
  isAdmin: boolean,
  credentials: AdminCredential[] | undefined,
  role?: string,
): boolean {
  if (isAdmin && role === "super_admin") return true;
  if (!isAdmin || !credentials) return false;
  return credentials.some(
    (c) => c.credential === "files_credentials" && c.enabled,
  );
}

import { z } from "zod";

export const AdminCredentialEnum = z.enum([
  "center",
  "fundraiser",
  "donation",
  "files_credentials",
  "user_management",
  "donor_management",
  "contact_us_management",
  "ambassador_management",
  "newsletter_management",
]);

export type AdminCredentialEnumType = z.infer<typeof AdminCredentialEnum>;
