import { NextResponse } from 'next/server';
import { findRecipesByQuery, type RecipeIngredient } from '@/lib/recipes';

interface RecipeSuggestion {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  source: 'recipe';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  const recipes = findRecipesByQuery(q);

  const suggestions: RecipeSuggestion[] = recipes.flatMap((recipe) =>
    recipe.ingredients.map((ing): RecipeSuggestion => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category,
      source: 'recipe',
    }))
  );

  return NextResponse.json({ suggestions });
}
