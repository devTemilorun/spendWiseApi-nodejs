import { Category, ICategory } from '../models/Category.model';
import { AppError } from '../utils/AppError';
import { CreateCategoryInput } from '../validators/transaction.schema';

export const listCategories = async (userId: string): Promise<ICategory[]> => {
  return Category.find({ $or: [{ userId: null }, { userId }] }).sort({ name: 1 });
};

export const addCustomCategory = async (
  userId: string,
  data: CreateCategoryInput
): Promise<ICategory> => {
  const exists = await Category.findOne({ userId, name: data.name });
  if (exists) throw new AppError('Category already exists', 409);

  const cat = await Category.create({
    name: data.name,
    keywords: data.keywords,
    isFlagged: false,
    userId,
  });
  return cat;
};

export const deleteCustomCategory = async (
  id: string,
  userId: string
): Promise<void> => {
  const cat = await Category.findOneAndDelete({ _id: id, userId });
  if (!cat) throw new AppError('Category not found or not yours', 404);
};