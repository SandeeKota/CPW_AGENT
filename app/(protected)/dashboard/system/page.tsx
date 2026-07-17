"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/layout/dashboard-layout";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Progress } from "@/app/components/ui/progress";
import {
  AlertCircle,
  Badge,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Server,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { useAuthStore } from "@/app/stores/authStore";

export default function SystemPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and monitor platform health
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>
                Configure general platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" defaultValue="FundRaiser" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-description">
                  Platform Description
                </Label>
                <Textarea
                  id="platform-description"
                  defaultValue="A comprehensive fundraising platform for managing campaigns and donations."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Support Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  defaultValue="support@fundraiser.com"
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Features</h3>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-campaigns">Enable Campaigns</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to create and manage fundraising campaigns
                      </p>
                    </div>
                    <Switch id="enable-campaigns" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-donations">Enable Donations</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to make donations to campaigns
                      </p>
                    </div>
                    <Switch id="enable-donations" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-analytics">Enable Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable analytics and reporting features
                      </p>
                    </div>
                    <Switch id="enable-analytics" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security settings for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentication</h3>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Require two-factor authentication for all users
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="password-complexity">
                        Password Complexity
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce strong password requirements
                      </p>
                    </div>
                    <Switch id="password-complexity" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="session-timeout">Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out inactive users after 30 minutes
                      </p>
                    </div>
                    <Switch id="session-timeout" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Protection</h3>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="data-encryption">Data Encryption</Label>
                      <p className="text-sm text-muted-foreground">
                        Encrypt all sensitive data stored in the database
                      </p>
                    </div>
                    <Switch id="data-encryption" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="audit-logging">Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log all administrative actions for security auditing
                      </p>
                    </div>
                    <Switch id="audit-logging" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Integrations</CardTitle>
              <CardDescription>
                Configure payment gateways and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                      <span className="text-blue-600 font-bold dark:text-blue-300">
                        P
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">PayPal</h4>
                      <p className="text-sm text-muted-foreground">
                        Accept donations via PayPal
                      </p>
                    </div>
                  </div>
                  <Switch id="paypal" defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-id">Client ID</Label>
                  <Input
                    id="paypal-client-id"
                    defaultValue="••••••••••••••••••••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-secret">Client Secret</Label>
                  <Input
                    id="paypal-secret"
                    type="password"
                    defaultValue="••••••••••••••••••••••••••••"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                      <span className="text-blue-600 font-bold dark:text-blue-300">
                        S
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">Stripe</h4>
                      <p className="text-sm text-muted-foreground">
                        Accept credit card donations via Stripe
                      </p>
                    </div>
                  </div>
                  <Switch id="stripe" />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="stripe-key">API Key</Label>
                  <Input
                    id="stripe-key"
                    defaultValue=""
                    placeholder="Enter your Stripe API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">Secret Key</Label>
                  <Input
                    id="stripe-secret"
                    type="password"
                    defaultValue=""
                    placeholder="Enter your Stripe secret key"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>
                Configure email service for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" defaultValue="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" defaultValue="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  defaultValue="notifications@fundraiser.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  defaultValue="••••••••••••••••"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Test Connection</Button>
                <Button variant="outline">Send Test Email</Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-medium">Operational</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last checked: Today at 10:45 AM
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Usage</span>
                    <span className="text-sm font-medium">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Usage</span>
                    <span className="text-sm font-medium">64%</span>
                  </div>
                  <Progress value={64} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Monitor the health and performance of your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Application Server</h4>
                      <p className="text-sm text-muted-foreground">
                        Main application server
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Healthy</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Database</h4>
                      <p className="text-sm text-muted-foreground">
                        Primary database server
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Healthy</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Storage</h4>
                      <p className="text-sm text-muted-foreground">
                        File storage system
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500">Warning</Badge>
                </div>
              </div>

              <Alert variant={"default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Storage Warning</AlertTitle>
                <AlertDescription>
                  Storage capacity is at 85%. Consider upgrading your storage
                  plan or cleaning up unused files.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>
                System maintenance and backup options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automated Backups</h3>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="daily-backup">Daily Backups</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically backup the database daily
                      </p>
                    </div>
                    <Switch id="daily-backup" defaultChecked />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="backup-time">Backup Time</Label>
                    <Input id="backup-time" defaultValue="02:00" type="time" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="retention">Retention Period (days)</Label>
                    <Input
                      id="retention"
                      defaultValue="30"
                      type="number"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline">Create Manual Backup</Button>
                <Button variant="outline">Restore from Backup</Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
