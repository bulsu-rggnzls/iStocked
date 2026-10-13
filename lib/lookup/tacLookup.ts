export interface TacResult {
  model: string;
  storageOptions: string[];
  colorOptions: string[];
}

const TAC_DB: Record<string, TacResult> = {
  // iPhone X
  "35303408": { model: "iPhone X", storageOptions: ["64GB", "256GB"], colorOptions: ["Silver", "Space Gray"] },
  // iPhone XR
  "35330109": { model: "iPhone XR", storageOptions: ["64GB", "128GB", "256GB"], colorOptions: ["White", "Black", "Blue", "Yellow", "Coral", "Red"] },
  // iPhone XS
  "35400209": { model: "iPhone XS", storageOptions: ["64GB", "256GB", "512GB"], colorOptions: ["Gold", "Space Gray", "Silver"] },
  // iPhone XS Max
  "35381609": { model: "iPhone XS Max", storageOptions: ["64GB", "256GB", "512GB"], colorOptions: ["Gold", "Space Gray", "Silver"] },
  // iPhone 11
  "35260310": { model: "iPhone 11", storageOptions: ["64GB", "128GB", "256GB"], colorOptions: ["Black", "Green", "Yellow", "Purple", "Red", "White"] },
  // iPhone 11 Pro
  "35383610": { model: "iPhone 11 Pro", storageOptions: ["64GB", "256GB", "512GB"], colorOptions: ["Midnight Green", "Space Gray", "Silver", "Gold"] },
  // iPhone 11 Pro Max
  "35321710": { model: "iPhone 11 Pro Max", storageOptions: ["64GB", "256GB", "512GB"], colorOptions: ["Midnight Green", "Space Gray", "Silver", "Gold"] },
  // iPhone SE (2nd gen)
  "35652511": { model: "iPhone SE (2nd gen)", storageOptions: ["64GB", "128GB", "256GB"], colorOptions: ["Black", "White", "Red"] },
  // iPhone 12 mini
  "35438711": { model: "iPhone 12 mini", storageOptions: ["64GB", "128GB", "256GB"], colorOptions: ["Black", "White", "Red", "Green", "Blue"] },
  // iPhone 12
  "35304811": { model: "iPhone 12", storageOptions: ["64GB", "128GB", "256GB"], colorOptions: ["Black", "White", "Red", "Green", "Blue"] },
  // iPhone 12 Pro
  "35273611": { model: "iPhone 12 Pro", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Gold", "Graphite", "Pacific Blue", "Silver"] },
  // iPhone 12 Pro Max
  "35385411": { model: "iPhone 12 Pro Max", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Gold", "Graphite", "Pacific Blue", "Silver"] },
  // iPhone 13 mini
  "35246012": { model: "iPhone 13 mini", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Starlight", "Midnight", "Blue", "Pink", "Red"] },
  // iPhone 13
  "35014712": { model: "iPhone 13", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Starlight", "Midnight", "Blue", "Pink", "Red"] },
  // iPhone 13 Pro
  "35174112": { model: "iPhone 13 Pro", storageOptions: ["128GB", "256GB", "512GB", "1TB"], colorOptions: ["Gold", "Silver", "Graphite", "Sierra Blue", "Alpine Green"] },
  // iPhone 13 Pro Max
  "35292812": { model: "iPhone 13 Pro Max", storageOptions: ["128GB", "256GB", "512GB", "1TB"], colorOptions: ["Gold", "Silver", "Graphite", "Sierra Blue", "Alpine Green"] },
  // iPhone SE (3rd gen)
  "35745212": { model: "iPhone SE (3rd gen)", storageOptions: ["64GB", "128GB", "256GB"], colorOptions: ["Starlight", "Midnight", "Red"] },
  // iPhone 14
  "35129413": { model: "iPhone 14", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Blue", "Purple", "Midnight", "Starlight", "Red"] },
  // iPhone 14 Plus
  "35187013": { model: "iPhone 14 Plus", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Blue", "Purple", "Midnight", "Starlight", "Red"] },
  // iPhone 14 Pro
  "35074313": { model: "iPhone 14 Pro", storageOptions: ["128GB", "256GB", "512GB", "1TB"], colorOptions: ["Space Black", "Silver", "Gold", "Deep Purple"] },
  // iPhone 14 Pro Max
  "35437513": { model: "iPhone 14 Pro Max", storageOptions: ["128GB", "256GB", "512GB", "1TB"], colorOptions: ["Space Black", "Silver", "Gold", "Deep Purple"] },
  // iPhone 15
  "35159014": { model: "iPhone 15", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Blue", "Pink", "Yellow", "Green", "Black"] },
  // iPhone 15 Plus
  "35646114": { model: "iPhone 15 Plus", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Blue", "Pink", "Yellow", "Green", "Black"] },
  // iPhone 15 Pro
  "35373014": { model: "iPhone 15 Pro", storageOptions: ["128GB", "256GB", "512GB", "1TB"], colorOptions: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"] },
  // iPhone 15 Pro Max
  "35448914": { model: "iPhone 15 Pro Max", storageOptions: ["256GB", "512GB", "1TB"], colorOptions: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"] },
  // iPhone SE (4th gen / 16e)
  "35605015": { model: "iPhone 16e", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Black", "White"] },
  // iPhone 16
  "35093915": { model: "iPhone 16", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Black", "White", "Pink", "Teal", "Ultramarine"] },
  // iPhone 16 Plus
  "35519415": { model: "iPhone 16 Plus", storageOptions: ["128GB", "256GB", "512GB"], colorOptions: ["Black", "White", "Pink", "Teal", "Ultramarine"] },
  // iPhone 16 Pro
  "35301215": { model: "iPhone 16 Pro", storageOptions: ["128GB", "256GB", "512GB", "1TB"], colorOptions: ["Natural Titanium", "Desert Titanium", "White Titanium", "Black Titanium"] },
  // iPhone 16 Pro Max
  "35582015": { model: "iPhone 16 Pro Max", storageOptions: ["256GB", "512GB", "1TB"], colorOptions: ["Natural Titanium", "Desert Titanium", "White Titanium", "Black Titanium"] },
};

export function lookupByTac(imei: string): TacResult | null {
  const digits = imei.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return TAC_DB[digits.slice(0, 8)] ?? null;
}

// Fallback picker when the IMEI's TAC is not in the local DB (Apple allocates
// many TACs per model across factories/regions — a local table can't be exhaustive)
export const IPHONE_MODELS: string[] = [
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 16e",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Plus",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Plus",
  "iPhone 14",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13",
  "iPhone 13 mini",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12",
  "iPhone 12 mini",
  "iPhone SE (3rd gen)",
  "iPhone SE (2nd gen)",
  "iPhone 11 Pro Max",
  "iPhone 11 Pro",
  "iPhone 11",
  "iPhone XS Max",
  "iPhone XS",
  "iPhone XR",
  "iPhone X",
];
