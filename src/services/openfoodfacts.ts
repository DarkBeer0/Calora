import type { FoodItem } from '../types';

const BASE_URL = 'https://world.openfoodfacts.org';

interface OFFProduct {
  product_name?: string;
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
}

function mapToFoodItem(product: OFFProduct, barcode?: string): FoodItem | null {
  if (!product.product_name || !product.nutriments) return null;

  return {
    id: barcode || product.code || Date.now().toString(),
    name: product.product_name,
    caloriesPer100g: product.nutriments['energy-kcal_100g'] ?? 0,
    proteinPer100g: product.nutriments.proteins_100g ?? 0,
    fatPer100g: product.nutriments.fat_100g ?? 0,
    carbsPer100g: product.nutriments.carbohydrates_100g ?? 0,
    fiberPer100g: product.nutriments.fiber_100g ?? 0,
    sugarsPer100g: product.nutriments.sugars_100g ?? 0,
    saturatedFatPer100g: product.nutriments['saturated-fat_100g'] ?? 0,
    saltPer100g: product.nutriments.salt_100g ?? 0,
    barcode: barcode || product.code,
    source: 'openfoodfacts',
  };
}

export async function searchProducts(query: string): Promise<FoodItem[]> {
  const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20`;
  const response = await fetch(url);
  const data = await response.json();

  return (data.products || [])
    .map((p: OFFProduct) => mapToFoodItem(p))
    .filter((item: FoodItem | null): item is FoodItem => item !== null);
}

export async function getProductByBarcode(barcode: string): Promise<FoodItem | null> {
  const url = `${BASE_URL}/api/v0/product/${barcode}.json`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 1) return null;
  return mapToFoodItem(data.product, barcode);
}
