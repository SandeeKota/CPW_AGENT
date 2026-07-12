import { ObjectId } from "mongodb";

export enum UserRole {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  FUNDRAISER = "fundraiser",
  USER = "user",
  CA = "ca",
}

export interface UserDoc {
  _id?: ObjectId;
  sub?: string;
  email: string;
  email_verified?: boolean;
  name: string;
  nickname?: string;
  picture?: string;
  updated_at?: string;
  given_name?: string;
  family_name?: string;
  createdAt?: string;
  role?: UserRole;
  isAdminMode?: boolean;
  phone?: string;
  dial_code?: string;
  password?: string;
  isTestUser?: boolean;
  cognitoUserName?: string;
  passwordResetAt?: string;
}
