import { searchDirectory } from "../server/directory-properties";
import { DirectoryPropertyCard } from "./directory-property-card";

// Highest-rated listings as a card row, for pages outside /properties.
// Async: render it inside <Suspense>.
export async function TopRatedStays({ limit = 3 }: { limit?: number }) {
  const { properties } = await searchDirectory(
    { location: "", name: "", types: [], minRating: null, sort: "rating", page: 1 },
    limit,
  );
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <li key={property.slug}>
          <DirectoryPropertyCard property={property} />
        </li>
      ))}
    </ul>
  );
}
