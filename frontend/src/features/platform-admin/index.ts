// Platform Admin console (WEMIXT platform team). Independent of the Back
// Office shell; only generic ui/lib pieces are shared.
export { AdminShell } from "./admin-shell";
export { AdminSignInPage } from "./auth/sign-in-page";
export { adminPageMetadata } from "./admin-page";
export { PlatformOverview } from "./overview/overview";
export { OnboardingPage } from "./onboarding/onboarding-page";
export { NewCompanyPage } from "./onboarding/new-company-page";
export { AccountsPage } from "./accounts/accounts-page";
export { UsersPage } from "./users/users-page";
export { AdminUsersPage } from "./admin-users/admin-users-page";
export { FinancePage } from "./finance/finance-page";
export { ConfigurationPage } from "./configuration/configuration-page";
export { AnnouncementsPage } from "./announcements/announcements-page";
export { ContactMessagesPage } from "./contact-messages/contact-messages-page";
export { AnalyticsPage } from "./analytics/analytics-page";
export { AuditLogsPage } from "./audit-logs/audit-logs-page";
export { ADMIN_NAV, adminNavItem, isAdminNavActive, type AdminNavItem, type AdminNavKey } from "./nav";
