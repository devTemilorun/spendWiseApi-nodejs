import { Category } from '../models/Category.model';

export interface CategorizeResult {
  category: string;
  isFlagged: boolean;
}

//  Categorize a transaction by matching keywords against user-visible categories
export const categorizeTransaction = async (
  merchant: string | null,
  rawDesc: string | null,
  userId: string
): Promise<CategorizeResult> => {
  const haystack = `${merchant ?? ''} ${rawDesc ?? ''}`.toUpperCase().trim();

  if (!haystack) {
    return { category: 'uncategorized', isFlagged: false };
  }

  const categories = await Category.find({
    $or: [{ userId: null }, { userId }],
  }).lean();

  // Check each category's keywords against the haystack
  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      if (keyword && haystack.includes(keyword.toUpperCase())) {
        return {
          category: cat.name,
          isFlagged: cat.isFlagged,
        };
      }
    }
  }

  return { category: 'uncategorized', isFlagged: false };
};

//  Given a category name, return whether it's flagged (e.g. gambling).
export const flagIfSensitive = async (
  categoryName: string,
  userId: string
): Promise<boolean> => {
  const cat = await Category.findOne({
    name: categoryName.toLowerCase(),
    $or: [{ userId: null }, { userId }],
  }).lean();

  return cat?.isFlagged ?? false;
};