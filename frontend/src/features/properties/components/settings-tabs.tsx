import { ChipLink } from "@/components/ui/chip-link";
import { SETTINGS_TABS, type SettingsTab } from "../config";
import { settingsHref } from "../settings-params";

// Each tab is a link (it changes the URL), so this is a nav, not an ARIA tablist.
// Scrolls sideways on phones.
export function SettingsTabs({ propertyId, active }: { propertyId: string; active: SettingsTab }) {
  return (
    <nav aria-label="Property settings" className="-mx-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2">
        {SETTINGS_TABS.map(({ key, label }) => (
          <li key={key}>
            <ChipLink href={settingsHref(propertyId, { tab: key })} active={key === active} current="page" variant="outline">
              {label}
            </ChipLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
