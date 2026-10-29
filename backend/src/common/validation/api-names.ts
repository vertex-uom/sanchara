// API names are database enum values in lower-case kebab: HILL_COUNTRY ↔ hill-country.
export type KebabName<T extends string> = T extends `${infer Head}_${infer Tail}` ? `${Lowercase<Head>}-${KebabName<Tail>}` : Lowercase<T>;

export const toApiName = <T extends string>(value: T) => value.toLowerCase().replaceAll('_', '-') as KebabName<T>;
export const fromApiName = <T extends string>(name: string) => name.toUpperCase().replaceAll('-', '_') as T;
