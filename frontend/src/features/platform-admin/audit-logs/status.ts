import { Building2, CreditCard, Globe, KeyRound, Megaphone, Settings2, UsersRound, type LucideIcon } from "lucide-react";
import type { AuditCategory } from "../types";

export const CATEGORY_META: Record<AuditCategory, { label: string; icon: LucideIcon }> = {
  companies: { label: "Companies", icon: Building2 },
  "admin-users": { label: "Admin users", icon: UsersRound },
  finance: { label: "Finance", icon: CreditCard },
  configuration: { label: "Configuration", icon: Settings2 },
  announcements: { label: "Announcements", icon: Megaphone },
  websites: { label: "Websites", icon: Globe },
  "sign-ins": { label: "Sign-ins", icon: KeyRound },
};
