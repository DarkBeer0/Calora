import type { FoodItem } from '../types';

// Use locale-specific API subdomains for better results
const LOCALE_DOMAINS: Record<string, string> = {
  ru: 'https://ru.openfoodfacts.org',
  en: 'https://world.openfoodfacts.org',
  pl: 'https://pl.openfoodfacts.org',
};

let currentLang = 'ru';

/** Call this when language changes to update search locale */
export function setSearchLocale(lang: string) {
  currentLang = lang;
}

function getBaseUrl(): string {
  return LOCALE_DOMAINS[currentLang] || LOCALE_DOMAINS.en;
}

interface OFFProduct {
  product_name?: string;
  product_name_ru?: string;
  product_name_en?: string;
  product_name_pl?: string;
  generic_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    'saturated-fat_100g'?: number;
    salt_100g?: number;
  };
  code?: string;
  completeness?: number;
  popularity_key?: number;
  nutriscore_grade?: string;
}

/** Get the best available product name */
function getBestName(product: OFFProduct): string | null {
  // Try locale-specific name first, then generic, then any name
  const localeKey = `product_name_${currentLang}` as keyof OFFProduct;
  const localeName = product[localeKey] as string | undefined;
  if (localeName && localeName.trim()) return cleanName(localeName);
  if (product.product_name && product.product_name.trim()) return cleanName(product.product_name);
  if (product.generic_name && product.generic_name.trim()) return cleanName(product.generic_name);
  return null;
}

/** Clean up product name — remove excessive detail, trim */
function cleanName(name: string): string {
  return name
    .replace(/\s+/g, ' ')    // collapse whitespace
    .replace(/\(.*?\)/g, '') // remove parenthetical info
    .trim()
    .slice(0, 80);           // cap length
}

/** Format display name with optional brand */
function formatDisplayName(product: OFFProduct): string | null {
  const name = getBestName(product);
  if (!name) return null;

  // Add brand if short name and brand exists
  if (product.brands && name.length < 40) {
    const brand = product.brands.split(',')[0].trim();
    if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
      return `${name} (${brand})`;
    }
  }
  return name;
}

function mapToFoodItem(product: OFFProduct, barcode?: string): FoodItem | null {
  const name = formatDisplayName(product);
  if (!name || !product.nutriments) return null;

  // Filter out products with no nutritional data at all
  const n = product.nutriments;
  const hasAnyData = (n['energy-kcal_100g'] ?? 0) > 0 || (n.proteins_100g ?? 0) > 0;
  if (!hasAnyData) return null;

  return {
    id: barcode || product.code || Date.now().toString(),
    name,
    caloriesPer100g: Math.round(n['energy-kcal_100g'] ?? 0),
    proteinPer100g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    fatPer100g: Math.round((n.fat_100g ?? 0) * 10) / 10,
    carbsPer100g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fiberPer100g: Math.round((n.fiber_100g ?? 0) * 10) / 10,
    sugarsPer100g: Math.round((n.sugars_100g ?? 0) * 10) / 10,
    saturatedFatPer100g: Math.round((n['saturated-fat_100g'] ?? 0) * 10) / 10,
    saltPer100g: Math.round((n.salt_100g ?? 0) * 10) / 10,
    barcode: barcode || product.code,
    source: 'openfoodfacts',
  };
}

export async function searchProducts(query: string): Promise<FoodItem[]> {
  const baseUrl = getBaseUrl();

  // Use search_terms with locale-specific fields, sort by popularity
  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: '30',
    sort_by: 'unique_scans_n',  // sort by popularity (most scanned first)
    fields: [
      'product_name', `product_name_${currentLang}`, 'generic_name', 'brands',
      'nutriments', 'code', 'completeness',
    ].join(','),
  });

  const url = `${baseUrl}/cgi/search.pl?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Calora/0.1.0 (calorie-tracker-app)' },
  });
  const data = await response.json();

  const items = (data.products || [])
    .map((p: OFFProduct) => mapToFoodItem(p))
    .filter((item: FoodItem | null): item is FoodItem => item !== null);

  // Deduplicate by name (keep first = most popular)
  const seen = new Set<string>();
  const unique: FoodItem[] = [];
  for (const item of items) {
    const key = item.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.slice(0, 20);
}

export async function getProductByBarcode(barcode: string): Promise<FoodItem | null> {
  const url = `${LOCALE_DOMAINS.en}/api/v0/product/${barcode}.json`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Calora/0.1.0 (calorie-tracker-app)' },
  });
  const data = await response.json();

  if (data.status !== 1) return null;
  return mapToFoodItem(data.product, barcode);
}
