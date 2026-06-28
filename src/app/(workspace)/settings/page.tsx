import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import {
  Pencil,
  Mail,
  ShieldCheck,
  User,
  Building2,
  Factory,
  Users,
  KeyRound,
  Download,
  Trash2,
  CreditCard,
  BadgeCheck,
  CalendarClock,
  Check,
  Scale,
  Bell,
  Briefcase,
  TrendingUp,
  Palette,
  Save,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Disclaimer } from '@/components/ui/disclaimer';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { CURRENT_USER } from '@/lib/data';
import { formatDate, initials } from '@/lib/utils';
import { getCurrentSubscription } from '@/lib/billing/account';
import { getPlan, formatPrice } from '@/lib/billing/plans';
import { customerPortalUrl } from '@/lib/billing/payments';

export const metadata: Metadata = { title: 'Settings' };

// ── Static settings copy (demo workspace) ────────────────────────────────
type ToggleSetting = {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  defaultChecked?: boolean;
};

type UsageMetric = { label: string; used: number; cap: number; icon: LucideIcon };

const USAGE: UsageMetric[] = [
  { label: 'AI letters generated', used: 18, cap: 50, icon: FileText },
  { label: 'Award searches', used: 64, cap: 200, icon: Scale },
  { label: 'Team seats', used: 1, cap: 3, icon: Users },
];

const PREFERENCES: ToggleSetting[] = [
  {
    id: 'pref-jurisdiction',
    icon: Scale,
    label: 'Default to Malaysian jurisdiction',
    description:
      'Pre-fill the Industrial Court (Malaysia) on new cases, letters, and award searches.',
    defaultChecked: true,
  },
  {
    id: 'pref-digest',
    icon: Mail,
    label: 'Weekly email digest',
    description: 'A Monday summary of case activity and upcoming hearings.',
    defaultChecked: true,
  },
  {
    id: 'pref-autosave',
    icon: Save,
    label: 'Auto-save letter drafts',
    description: 'Keep a working copy of every draft as you edit, so nothing is lost.',
    defaultChecked: true,
  },
  {
    id: 'pref-theme',
    icon: Palette,
    label: 'Match system appearance',
    description:
      'Follow your device light / dark setting. Light theme is the current default — dark mode is rolling out.',
    defaultChecked: false,
  },
];

const NOTIFICATIONS: ToggleSetting[] = [
  {
    id: 'notif-assigned',
    icon: Briefcase,
    label: 'New case assigned',
    description: 'When a disciplinary case is assigned to you.',
    defaultChecked: true,
  },
  {
    id: 'notif-hearing',
    icon: CalendarClock,
    label: 'Hearing reminders',
    description: 'A heads-up 48 hours before a scheduled hearing.',
    defaultChecked: true,
  },
  {
    id: 'notif-pip',
    icon: TrendingUp,
    label: 'PIP review due',
    description: 'When a performance improvement plan reaches a review date.',
    defaultChecked: true,
  },
  {
    id: 'notif-summary',
    icon: Bell,
    label: 'Weekly summary',
    description: 'A digest of your full caseload, every Monday morning.',
    defaultChecked: false,
  },
];

/** A label + description on the left, a toggle checkbox on the right. */
function ToggleRow({ id, icon: Icon, label, description, defaultChecked }: ToggleSetting) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="space-y-0.5">
          <Label htmlFor={id} className="cursor-pointer">
            {label}
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <Checkbox id={id} defaultChecked={defaultChecked} aria-label={label} className="mt-1" />
    </div>
  );
}

/** A muted icon label / strong value row used in the profile & org cards. */
function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const sub = getCurrentSubscription();
  const plan = getPlan(sub.planId);
  const planPrice = sub.period === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const renewDate = sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '—';
  const portalUrl = customerPortalUrl();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, subscription, and workspace preferences."
      />

      <Disclaimer>
        This is a demonstration workspace. Profile, organization, and billing details are sample
        data, not a live account.
      </Disclaimer>

      <Tabs defaultValue="profile">
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* ── Profile ───────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Profile information</CardTitle>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4" /> Edit Profile
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {initials(CURRENT_USER.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-foreground">
                        {CURRENT_USER.fullName}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {CURRENT_USER.role}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <InfoRow icon={User} label="Full name" value={CURRENT_USER.fullName} />
                    <InfoRow icon={ShieldCheck} label="Role" value={CURRENT_USER.role} />
                    <InfoRow icon={Mail} label="Email" value={CURRENT_USER.email} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization information</CardTitle>
                  <CardDescription>Details used across letters and filings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow
                    icon={Building2}
                    label="Organization"
                    value={CURRENT_USER.organization}
                  />
                  <InfoRow icon={Factory} label="Industry" value={CURRENT_USER.industry} />
                  <InfoRow icon={Users} label="Company size" value={CURRENT_USER.companySize} />
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change password</CardTitle>
                  <CardDescription>
                    Use at least 8 characters with a mix of letters and numbers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>
                    <KeyRound className="h-4 w-4" /> Update Password
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account actions</CardTitle>
                  <CardDescription>Manage your data and account status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">Download my data</div>
                      <div className="text-xs text-muted-foreground">
                        Export your cases, letters, and account info as a ZIP.
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/[0.03] p-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">Deactivate account</div>
                      <div className="text-xs text-muted-foreground">
                        Temporarily disable access. Your data is retained.
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="shrink-0">
                          <Trash2 className="h-4 w-4" /> Deactivate
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Deactivate your account?</DialogTitle>
                          <DialogDescription>
                            Your workspace will be disabled and any teammates will lose access. Your
                            cases and letters are retained for 90 days, so you can reactivate
                            anytime within that window.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-muted-foreground">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <p className="leading-relaxed">
                            This is a demonstration account, so nothing is actually deactivated.
                          </p>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button variant="destructive">
                              <Trash2 className="h-4 w-4" /> Deactivate account
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Subscription ──────────────────────────────────────────────── */}
        <TabsContent value="subscription">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BadgeCheck className="h-5 w-5 text-primary" /> {plan.name}
                  </CardTitle>
                  <CardDescription>
                    {formatPrice(planPrice)}
                    {planPrice > 0 &&
                      ` / ${sub.period === 'monthly' ? 'month' : 'year'} · billed ${sub.period}`}
                  </CardDescription>
                </div>
                <Badge variant="success">{sub.status === 'active' ? 'Active' : sub.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Renews on <span className="font-medium text-foreground">{renewDate}</span>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Included in your plan
                  </p>
                  <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <span className="text-xs text-muted-foreground">
                  Visa ending 4242 · next charge {renewDate}
                </span>
                <div className="flex gap-2">
                  {portalUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                        <CreditCard className="h-4 w-4" /> Manage billing
                      </a>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/pricing">
                        <CreditCard className="h-4 w-4" /> Manage billing
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/pricing">Change plan</Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage this month</CardTitle>
                <CardDescription>Resets on {formatDate('2026-07-01')}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {USAGE.map((u) => {
                  const Icon = u.icon;
                  const pct = Math.min(100, Math.round((u.used / u.cap) * 100));
                  return (
                    <div key={u.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="h-4 w-4" /> {u.label}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {u.used} <span className="text-muted-foreground">/ {u.cap}</span>
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" /> Active cases
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums text-foreground">12</span>
                    <Badge variant="muted">Unlimited</Badge>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Defaults applied across your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {PREFERENCES.map((p) => (
                <ToggleRow key={p.id} {...p} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose what we email you about. You can change these anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {NOTIFICATIONS.map((n) => (
                <ToggleRow key={n.id} {...n} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
