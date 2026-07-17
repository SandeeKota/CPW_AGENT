"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent } from "@/app/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { useTheme } from "next-themes";
import { getImageFromLocal, getImageUrl } from "@/lib/utils";
import LoadingScreen from "@/app/components/loadingScreen";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { updateUser } from "@/app/helpers/user_helper";
import { UserSchema } from "@/app/_types/user.type";
import { useDashboardAnalytics } from "@/app/helpers/analytics.helper";
import { coverFormatedCurrency } from "@/lib/convertToSubcurrency";
import { DEFAULT_CONTRY_CODE } from "@/app/utils/country_codes";
import CountryDropdown from "@/app/components/CountryDropdown";
import { useAuthStore, User } from "@/app/stores/authStore";
import { LogOut, Camera, CheckCircle2, XCircle } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";
import cognitoService from "@/app/_services/aws-cognito.service";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { AdminCredentialEnum } from "@/app/_types/admin-credential.enum";

type TabsType = "profile" | "notifications" | "appearance";
const TabItems: TabsType[] = ["profile", "notifications", "appearance"];

interface ImpactsResponse {
  totalPeopleImpacted: number;
  totalFundraisers: number;
  centersImpacted: number;
  totalAmountRaisedByFundraisers: number;
  totalAmountDonatedbyMe: number;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [tabsDefaultValue, setTabsDefaultValue] = useState<TabsType>("profile");
  const [impactsData, setImpactsData] = useState<ImpactsResponse>(
    {} as ImpactsResponse,
  );
  const searchParams = useSearchParams();
  const { setTheme, theme } = useTheme();
  const { user, setUser, logout } = useAuthStore();
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [localUser, setLocalUser] = useState<User | null>(user);
  const { toast } = useToast();
  const { impactsToSettings } = useDashboardAnalytics("");
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const isAdminRole = user?.role === "admin" && user?.isAdminMode === true;
  const { credentials: adminCredentials, loading: adminAccessLoading } =
    useAdminCredentials(isAdminRole ? user?._id : null);
  const adminAccessStatus = AdminCredentialEnum.options.map((access) => {
    const enabled = adminCredentials.some(
      (cred) => cred.credential === access && cred.enabled,
    );
    return {
      access,
      label: access.replace(/_/g, " "),
      enabled,
    };
  });

  useEffect(() => {
    const tab = searchParams.get("from");
    if (tab && TabItems.includes(tab as TabsType)) {
      setTabsDefaultValue(tab as TabsType);
    }
  }, [searchParams]);

  useEffect(() => {
    loadImpacts();
  }, []);

  const loadImpacts = async () => {
    try {
      setIsLoading(true);
      const res = await impactsToSettings(selectedCurrency);
      setImpactsData(res && res !== undefined ? res : ({} as ImpactsResponse));
      setIsLoading(false);
    } catch {
      setImpactsData({} as ImpactsResponse);
    }
  };

  useEffect(() => {
    if (user) setLocalUser(user);
  }, [user]);

  const userUpdate = async () => {
    const userObj = { ...user, ...localUser };
    setIsLoading(true);
    setIsDirty(true);
    if (user?.password !== userObj?.password) {
      await updatePasswordInCognito();
    } else {
      const res = await updateUser(userObj);
      if (!res) {
        toast({ variant: "destructive", title: "User updated failed" });
      } else {
        setUser(userObj as User);
        toast({ variant: "default", title: "User updated successfully" });
      }
    }
    setIsLoading(false);
    setIsDirty(false);
  };

  const updatePasswordInCognito = async () => {
    const res = await cognitoService.updateUserPassword(
      user?.password || "",
      localUser?.password || "",
    );
    if (res && res?.success) {
      const updatePasswordIndb = await updateUser({ ...localUser });
      if (!updatePasswordIndb) {
        await cognitoService.updateUserPassword(
          user?.password || "",
          localUser?.password || "",
        );
        setUser({ ...localUser, password: user?.password || "" } as User);
        toast({
          variant: "default",
          title: res?.message || "Password updated failed",
        });
      }
      setUser(localUser as User);
      toast({ variant: "default", title: "Password updated successfully" });
    } else {
      setUser({ ...localUser, password: user?.password || "" } as User);
      toast({
        variant: "destructive",
        title: res?.message || "Password updated failed",
      });
    }
  };

  const handleProfileUpdate = async (imageFile: File) => {
    setIsLoading(true);
    const image = await getImageFromLocal(imageFile, "user", "picture");
    if (!image) {
      toast({ variant: "destructive", title: "Something went wrong" });
    } else {
      const userdetails = { ...user, picture: image as string };
      const res = await updateUser(userdetails as UserSchema);
      if (!res) {
        toast({
          variant: "destructive",
          title: "Failed to update profile image",
        });
      } else {
        setUser(userdetails as User);
        toast({ variant: "default", title: "Profile image updated" });
      }
    }
    setIsLoading(false);
  };

  const handleLogout = () => logout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogoutConfirm = (choice: "yes" | "no") => {
    setShowLogoutConfirm(false);
    if (choice === "yes") {
      logout();
    }
  };

  const impactStats = [
    {
      label: "Fundraisers Supported",
      value: impactsData?.totalFundraisers || 0,
    },
    {
      label: "Funds Raised",
      value:
        coverFormatedCurrency(
          impactsData?.totalAmountRaisedByFundraisers || 0,
          selectedCurrency || "INR",
        ) || 0,
    },
    { label: "Schools Impacted", value: impactsData?.centersImpacted || 0 },
    { label: "People Impacted", value: impactsData?.totalPeopleImpacted || 0 },
    {
      label: "Amount Donated by Me",
      value:
        coverFormatedCurrency(
          impactsData?.totalAmountDonatedbyMe || 0,
          selectedCurrency || "INR",
        ) || 0,
    },
  ];

  return (
    <React.Fragment>
      {isLoading && <LoadingScreen inside={true} />}

      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 ">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#173945]">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your account settings and preferences
            </p>
          </div>
          <>
            <ConfirmModal
              title="Confirm Logout"
              message="Are you sure you want to log out?"
              yesLabel="Logout"
              noLabel="Cancel"
              onSelect={handleLogoutConfirm}
            >
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#d46535]/40 text-[#d46535] text-sm font-medium hover:bg-[#d46535]/10 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </ConfirmModal>
          </>
        </div>

        <div>
          <Tabs defaultValue={tabsDefaultValue} className="space-y-6">
            <TabsContent value="profile" className="space-y-5">
              {/* Profile Information */}
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-[#227077]" />
                    <CardTitle className="text-[#173945] text-lg">
                      Profile Information
                    </CardTitle>
                  </div>
                  <CardDescription className="ml-3">
                    Update your personal information and profile settings
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-5">
                  {/* Avatar row */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative w-fit">
                      <Avatar className="h-20 w-20 ring-2 ring-[#227077]/30 ring-offset-2">
                        <AvatarImage
                          src={getImageUrl(user?.picture || "")}
                          alt="avatar"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-[#227077] text-white text-xl">
                          {user?.name?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="relative overflow-hidden inline-flex">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#227077] text-[#227077] text-sm font-medium hover:bg-[#227077]/10 transition-colors">
                          <Camera className="w-4 h-4" />
                          Change Avatar
                          <input
                            type="file"
                            accept="image/*"
                            className="opacity-0 absolute inset-0 cursor-pointer"
                            onChange={(e) =>
                              e?.target?.files?.[0] &&
                              handleProfileUpdate(e.target.files[0])
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="fname"
                        className="text-[#173945] font-medium text-sm"
                      >
                        First Name
                      </Label>
                      <Input
                        id="fname"
                        type="text"
                        defaultValue={user?.given_name || ""}
                        placeholder="First Name"
                        className="focus-visible:ring-[#227077]/50 border-gray-200"
                        onChange={(e) => {
                          setLocalUser({
                            ...localUser,
                            given_name: e.target.value || "",
                          } as User);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="lname"
                        className="text-[#173945] font-medium text-sm"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lname"
                        type="text"
                        defaultValue={user?.family_name}
                        placeholder="Last Name"
                        className="focus-visible:ring-[#227077]/50 border-gray-200"
                        onChange={(e) => {
                          setIsDirty(true);
                          setLocalUser({
                            ...localUser,
                            family_name: e.target.value || "",
                          } as User);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-[#173945] font-medium text-sm"
                      >
                        Email Address
                      </Label>
                      <Input
                        disabled
                        id="email"
                        type="email"
                        defaultValue={user?.email}
                        className="bg-gray-50 border-gray-200 text-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="dial_code"
                        className="text-[#173945] font-medium text-sm"
                      >
                        Mobile Number
                      </Label>
                      <div className="flex flex-row items-center gap-2">
                        <div className="border border-gray-200 rounded-md px-2 py-1">
                          <CountryDropdown
                            value={localUser?.dial_code || DEFAULT_CONTRY_CODE}
                            onChange={(data: any) => {
                              setIsDirty(true);
                              setLocalUser({
                                ...localUser,
                                dial_code: data || DEFAULT_CONTRY_CODE,
                              } as User);
                            }}
                          />
                        </div>
                        <input
                          id="dial_code"
                          type="text"
                          className="flex h-10 w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#227077]/50 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue={user?.phone}
                          placeholder="Phone"
                          inputMode="numeric"
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setIsDirty(true);
                            setLocalUser({ ...localUser, phone: val } as User);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                  <Button
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => await userUpdate()}
                    disabled={isLoading || !isDirty}
                    className="bg-[#227077] hover:bg-[#1a5e64] text-white border-0 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              {/* My Impact */}
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-[#d46535]" />
                    <CardTitle className="text-[#173945] text-lg">
                      My Impact
                    </CardTitle>
                  </div>
                  <CardDescription className="ml-3">
                    An overview of your overall impact till date
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-5">
                  <div className="w-full grid screen1024:grid-cols-3 grid-cols-1 sm:grid-cols-2 gap-4">
                    {impactStats.map((stat, i) => (
                      <div
                        key={i}
                        className="px-5 py-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col gap-1"
                        style={{
                          borderLeft: `3px solid ${i % 2 === 0 ? "#227077" : "#d46535"}`,
                        }}
                      >
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {stat.label}
                        </span>
                        <span className="text-xl font-bold text-[#173945]">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* <div className="flex flex-col gap-3 pt-2">
                    <h2 className="text-base font-semibold text-[#173945]">Quick Links</h2>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Terms & Conditions", href: "/dashboard/settings/terms-conditions" },
                        { label: "Privacy Policy", href: "/dashboard/settings/privacy-policy" },
                        { label: "Refund Policy", href: "/dashboard/settings/refund-policy" },
                        { label: "Contact Us", href: "/dashboard/contacts/contact-us" },
                      ].map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="text-[#227077] hover:text-[#1a5e64] underline underline-offset-2 text-sm w-fit font-medium transition-colors"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div> */}
                </CardContent>
              </Card>

              {isAdminRole && (
                <Card className="border border-gray-100 shadow-sm">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full bg-[#227077]" />
                      <CardTitle className="text-[#173945] text-lg">
                        Admin Access
                      </CardTitle>
                    </div>
                    <CardDescription className="ml-3">
                      Check mark means granted, cross means not granted
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {adminAccessLoading ? (
                      <p className="text-sm text-gray-500">Loading access...</p>
                    ) : adminAccessStatus.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {adminAccessStatus.map(({ access, label, enabled }) => (
                          <div
                            key={access}
                            className="rounded-lg border border-gray-100 bg-[#f8fbfc] px-4 py-2 text-sm font-medium text-[#173945] capitalize flex items-center justify-between"
                          >
                            <span>{label}</span>
                            {enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No admin access assigned.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {false && (
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how and when you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Email Notifications
                      </h3>
                      <Separator />
                      <div className="space-y-4">
                        {[
                          {
                            id: "new-donation",
                            label: "New Donations",
                            desc: "Receive notifications when new donations are made",
                            defaultChecked: true,
                          },
                          {
                            id: "campaign-updates",
                            label: "Campaign Updates",
                            desc: "Receive updates about your campaigns",
                            defaultChecked: true,
                          },
                          {
                            id: "goal-reached",
                            label: "Goal Reached",
                            desc: "Receive notifications when a campaign goal is reached",
                            defaultChecked: true,
                          },
                          {
                            id: "marketing",
                            label: "Marketing",
                            desc: "Receive marketing emails and newsletters",
                            defaultChecked: false,
                          },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <Label htmlFor={item.id}>{item.label}</Label>
                              <p className="text-sm text-muted-foreground">
                                {item.desc}
                              </p>
                            </div>
                            <Switch
                              id={item.id}
                              defaultChecked={item.defaultChecked}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button disabled={isLoading || !isDirty}>
                      {isLoading ? "Saving..." : "Save Preferences"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            )}

            {false && (
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how the dashboard looks and feels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Theme</h3>
                      <Separator />
                      <div className="grid grid-cols-3 gap-4">
                        {(["light", "dark", "system"] as const).map((t) => (
                          <div key={t} className="space-y-2">
                            <div
                              onClick={() => setTheme(t)}
                              className={`border-2 ${theme === t ? "border-[#227077]" : "border-muted"} rounded-md p-2 cursor-pointer`}
                            >
                              <div
                                className={`h-20 rounded-md flex items-center justify-center ${t === "light" ? "bg-white" : t === "dark" ? "bg-black" : "bg-gradient-to-b from-white to-black"}`}
                              >
                                <span
                                  className={t === "dark" ? "text-white" : ""}
                                >
                                  {t.charAt(0).toUpperCase() + t.slice(1)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-center capitalize">
                              {t}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button disabled={isLoading || !isDirty}>
                      {isLoading ? "Saving..." : "Save Preferences"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </React.Fragment>
  );
}
