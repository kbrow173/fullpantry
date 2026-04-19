// Smart unit suggestions based on ingredient name keywords.
// Returns an ordered list of likely units — first is the best default.

const UNIT_MAP: Array<{ keywords: string[]; units: string[] }> = [
  // Liquids
  { keywords: ["milk", "cream", "buttermilk", "half-and-half"], units: ["cups", "oz", "ml"] },
  { keywords: ["juice", "cider", "wine", "beer", "broth", "stock", "water", "coffee", "tea"], units: ["cups", "oz", "ml"] },
  { keywords: ["oil", "olive oil", "vegetable oil", "coconut oil", "sesame oil"], units: ["tbsp", "cups", "oz"] },
  { keywords: ["vinegar", "soy sauce", "fish sauce", "hot sauce", "worcestershire"], units: ["tbsp", "tsp"] },
  { keywords: ["vanilla", "extract", "syrup"], units: ["tsp", "tbsp"] },
  { keywords: ["honey", "maple syrup", "molasses", "agave"], units: ["tbsp", "cups", "oz"] },
  // Dairy
  { keywords: ["butter"], units: ["tbsp", "cups", "oz", "stick"] },
  { keywords: ["yogurt", "sour cream", "cream cheese", "cottage cheese", "ricotta"], units: ["cups", "oz", "lb"] },
  { keywords: ["cheese", "parmesan", "cheddar", "mozzarella", "feta", "brie", "gouda"], units: ["cups", "oz", "lb"] },
  // Eggs — no unit (count)
  { keywords: ["eggs", "egg"], units: [] },
  // Produce — weight or count
  { keywords: ["garlic"], units: ["cloves", "tsp", "tbsp"] },
  { keywords: ["onion", "shallot", "leek", "scallion", "chive"], units: ["lb", "oz"] },
  { keywords: ["tomato", "tomatoes"], units: ["lb", "oz", "can"] },
  { keywords: ["spinach", "kale", "arugula", "lettuce", "greens"], units: ["cups", "oz", "lb"] },
  { keywords: ["berries", "blueberries", "strawberries", "raspberries", "blackberries"], units: ["cups", "oz", "lb"] },
  { keywords: ["apple", "apples", "pear", "pears", "orange", "oranges", "lemon", "lemons", "lime", "limes"], units: ["lb", "oz"] },
  { keywords: ["banana", "bananas"], units: ["lb"] },
  { keywords: ["potato", "potatoes", "sweet potato"], units: ["lb", "oz"] },
  { keywords: ["carrot", "carrots", "celery", "broccoli", "cauliflower", "zucchini", "squash", "bell pepper"], units: ["lb", "oz"] },
  { keywords: ["mushroom", "mushrooms"], units: ["oz", "lb", "cups"] },
  { keywords: ["avocado", "cucumber", "corn", "artichoke"], units: ["lb", "oz"] },
  { keywords: ["ginger"], units: ["tsp", "tbsp", "oz"] },
  { keywords: ["lemon juice", "lime juice"], units: ["tbsp", "tsp", "cups"] },
  // Dry goods
  { keywords: ["flour", "all-purpose flour", "bread flour", "whole wheat flour", "almond flour"], units: ["cups", "oz", "g", "lb"] },
  { keywords: ["sugar", "brown sugar", "powdered sugar", "cane sugar", "granulated sugar"], units: ["cups", "oz", "g", "lb"] },
  { keywords: ["salt", "kosher salt", "sea salt", "table salt"], units: ["tsp", "tbsp"] },
  { keywords: ["baking powder", "baking soda", "cream of tartar", "cornstarch", "arrowroot"], units: ["tsp", "tbsp"] },
  { keywords: ["yeast"], units: ["tsp", "tbsp", "packet"] },
  { keywords: ["cocoa", "chocolate chips", "chocolate"], units: ["cups", "oz", "g"] },
  { keywords: ["oats", "rolled oats", "oatmeal"], units: ["cups", "oz"] },
  { keywords: ["rice", "quinoa", "farro", "barley", "couscous"], units: ["cups", "oz", "lb"] },
  { keywords: ["pasta", "noodles", "spaghetti", "penne", "rigatoni", "fettuccine", "linguine"], units: ["oz", "lb", "g"] },
  { keywords: ["breadcrumbs", "panko"], units: ["cups", "oz"] },
  { keywords: ["nuts", "almonds", "walnuts", "pecans", "cashews", "pine nuts", "peanuts", "pistachios"], units: ["cups", "oz"] },
  { keywords: ["seeds", "sesame seeds", "chia seeds", "flax seeds", "sunflower seeds", "pumpkin seeds"], units: ["tbsp", "cups", "oz"] },
  { keywords: ["dried fruit", "raisins", "cranberries", "dates", "apricots"], units: ["cups", "oz"] },
  // Canned / jarred
  { keywords: ["canned", "can of", "tomato paste", "tomato sauce", "crushed tomatoes", "diced tomatoes"], units: ["can", "oz"] },
  { keywords: ["beans", "chickpeas", "lentils", "black beans", "kidney beans", "navy beans"], units: ["can", "cups", "oz", "lb"] },
  { keywords: ["coconut milk", "coconut cream"], units: ["can", "cups", "oz"] },
  // Meat / protein
  { keywords: ["chicken", "beef", "pork", "lamb", "turkey", "veal", "bison"], units: ["lb", "oz", "g"] },
  { keywords: ["salmon", "tuna", "shrimp", "fish", "cod", "tilapia", "halibut", "scallops", "crab", "lobster"], units: ["lb", "oz", "g"] },
  { keywords: ["bacon", "prosciutto", "pancetta", "salami", "sausage"], units: ["oz", "lb", "slices"] },
  // Herbs & spices
  { keywords: ["pepper", "black pepper", "white pepper", "cayenne", "chili flakes", "red pepper flakes"], units: ["tsp", "tbsp"] },
  { keywords: ["cumin", "coriander", "turmeric", "paprika", "oregano", "thyme", "basil", "rosemary", "sage", "dill", "parsley", "cilantro", "mint", "tarragon"], units: ["tsp", "tbsp"] },
  { keywords: ["cinnamon", "nutmeg", "allspice", "cardamom", "cloves", "ginger powder"], units: ["tsp", "tbsp"] },
  // Condiments
  { keywords: ["mustard", "ketchup", "mayo", "mayonnaise", "relish"], units: ["tbsp", "tsp"] },
  { keywords: ["jam", "jelly", "peanut butter", "almond butter", "tahini", "hummus"], units: ["tbsp", "cups", "oz"] },
];

export function suggestUnits(itemName: string): string[] {
  if (!itemName.trim()) return [];
  const lower = itemName.toLowerCase();

  for (const { keywords, units } of UNIT_MAP) {
    if (keywords.some((k) => lower.includes(k))) {
      return units;
    }
  }

  // Default suggestions for unknown items
  return ["oz", "lb", "cups", "g"];
}

// All units available in the unit input (for autocomplete / validation)
export const ALL_UNITS = [
  "tsp", "tbsp", "cups", "oz", "lb", "g", "kg", "ml", "liter",
  "can", "cloves", "slices", "stick", "packet", "bunch", "piece",
  "pinch", "dash", "handful",
];
