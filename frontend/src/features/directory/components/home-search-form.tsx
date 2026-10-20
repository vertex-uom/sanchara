import { ChevronDown, CircleDollarSign, House, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICE_RANGE_CONFIG, PROPERTY_TYPES, SEARCH_PATH, SRI_LANKA_DISTRICTS } from "../config";
import { SearchDivider, SearchField, searchControlClass } from "./search-field";

const { currency } = PRICE_RANGE_CONFIG;

// Plain GET form: /properties?location&type&minPrice&maxPrice. No client JS.
export function HomeSearchForm() {
  return (
    <form
      action={SEARCH_PATH}
      method="get"
      role="search"
      aria-label="Search stays"
      className="glass flex flex-col gap-1 rounded-3xl bg-white/85 p-2 shadow-xl md:flex-row md:items-center md:rounded-full"
    >
      <SearchField icon={MapPin} label="Location" htmlFor="search-location">
        <input
          id="search-location"
          name="location"
          type="text"
          list="search-districts"
          placeholder="Select district or town"
          autoComplete="off"
          className={searchControlClass}
        />
        <datalist id="search-districts">
          {SRI_LANKA_DISTRICTS.map((district) => (
            <option key={district} value={district} />
          ))}
        </datalist>
      </SearchField>

      <SearchDivider />

      <SearchField icon={House} label="Property type" htmlFor="search-type">
        {/* appearance-none drops the native inset so the value lines up with its label. */}
        <div className="relative">
          <select
            id="search-type"
            name="type"
            defaultValue=""
            className={cn(searchControlClass, "cursor-pointer appearance-none pr-6")}
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-brand-tropical"
          />
        </div>
      </SearchField>

      <SearchDivider />

      <SearchField icon={CircleDollarSign} label={`Price range (${currency})`} groupId="search-price-label">
        <div className="flex items-center gap-2">
          <PriceInput id="search-min-price" name="minPrice" placeholder="Min" ariaLabel={`Minimum price (${currency})`} />
          <span aria-hidden="true" className="text-brand-tropical">
            –
          </span>
          <PriceInput id="search-max-price" name="maxPrice" placeholder="Max" ariaLabel={`Maximum price (${currency})`} />
        </div>
      </SearchField>

      <button
        type="submit"
        className="focus-ring mt-1 flex min-h-12 items-center justify-between gap-6 rounded-full bg-linear-to-r from-brand-tropical via-brand-tropical to-brand-teal px-6 text-base font-medium text-white shadow-md md:mt-0 md:w-64 md:shrink-0"
      >
        Search
        <Search aria-hidden="true" className="size-5" />
      </button>
    </form>
  );
}

type PriceInputProps = { id: string; name: string; placeholder: string; ariaLabel: string };

function PriceInput({ id, name, placeholder, ariaLabel }: PriceInputProps) {
  return (
    <input
      id={id}
      name={name}
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={searchControlClass}
    />
  );
}
