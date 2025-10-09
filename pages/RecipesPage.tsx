
import React, { useState, useMemo } from 'react';
import { Recipe, MasterItem } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, BookOpenIcon, CopyIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';
import ConfirmationModal from '../components/ConfirmationModal';

interface RecipesListPageProps {
    recipes: Recipe[];
    masterItems: MasterItem[];
    onNewRecipe: () => void;
    onEditRecipe: (recipe: Recipe) => void;
    onDeleteRecipe: (recipeId: string) => void;
    onDuplicateRecipe: (recipeId: string) => void;
}

const RecipeCard: React.FC<{ recipe: Recipe, recipeCost: number, onEdit: () => void, onDelete: () => void, onDuplicate: () => void, t: (key: string) => string }> = ({ recipe, recipeCost, onEdit, onDelete, onDuplicate, t }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const handleDuplicateClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDuplicate();
    };

    const targetLiters = recipe.qualityControlSpec?.liters?.target ?? 0;
    const costPerLiter = targetLiters > 0 ? (recipeCost / targetLiters) : 0;

    return (
        <div
            onClick={onEdit}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
            role="button"
            tabIndex={0}
            aria-label={`Edit recipe for ${recipe.name}`}
            className="bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-color-accent">{recipe.name}</h3>
                    <p className="text-sm text-gray-500">{recipe.style}</p>
                    <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mt-2">
                        <span>{t('ABV')}: {recipe.qualityControlSpec?.abv?.target ?? 'N/A'}%</span>
                        <span>{t('IBU')}: {recipe.qualityControlSpec?.ibu?.target ?? 'N/A'}</span>
                        <span>{t('OG')}: {recipe.qualityControlSpec?.og?.target ?? 'N/A'}°P</span>
                        <span>{t('FG')}: {recipe.qualityControlSpec?.fg?.target ?? 'N/A'}°P</span>
                         {costPerLiter > 0 && <span>{t('Cost')}: {costPerLiter.toFixed(2)} €/L</span>}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDuplicateClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-color-secondary"
                        aria-label={`Duplicate recipe ${recipe.name}`}
                    >
                        <CopyIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-red-500"
                        aria-label={`Delete recipe ${recipe.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const RecipesListPage: React.FC<RecipesListPageProps> = ({ recipes, masterItems, onNewRecipe, onEditRecipe, onDeleteRecipe, onDuplicateRecipe }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

     const calculateRecipeCost = (recipe: Recipe): number => {
        const allIngredients = [...recipe.mashIngredients, ...recipe.boilWhirlpoolIngredients, ...recipe.tankIngredients];
        // FIX: Removed incorrect unit conversion logic. The `Ingredient` type does not
        // have a `unit` property. The purchaseCost on MasterItem is per its defined unit,
        // and the ingredient quantity is in that same unit. No conversion is needed.
        return allIngredients.reduce((total, ing) => {
            const item = masterItems.find(mi => mi.id === ing.masterItemId);
            const cost = item?.purchaseCost || 0;
            return total + (ing.quantity * cost);
        }, 0);
    };

    const filteredRecipes = useMemo(() => {
        if (!searchTerm) {
            return recipes;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(lowercasedTerm) ||
            recipe.style.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, recipes]);

    const handleDeleteRequest = (recipe: Recipe) => {
        setRecipeToDelete(recipe);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (recipeToDelete) {
            onDeleteRecipe(recipeToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setRecipeToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Recipe')}
                message={`${t('Are you sure you want to delete recipe')} "${recipeToDelete?.name}"? ${t('This action cannot be undone.')}`}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Recipes')}</h1>
                <button onClick={onNewRecipe} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Recipe')}</span>
                </button>
            </div>

            <div className="mb-4">
                <Input
                    placeholder={t('Search by name or style...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {filteredRecipes.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredRecipes.map(recipe => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            recipeCost={calculateRecipeCost(recipe)}
                            onEdit={() => onEditRecipe(recipe)} 
                            onDelete={() => handleDeleteRequest(recipe)}
                            onDuplicate={() => onDuplicateRecipe(recipe.id)}
                            t={t} 
                        />
                    ))}
                </div>
            ) : (
                 <div className="flex-1 flex items-center justify-center">
                    {recipes.length === 0 ? (
                         <EmptyState 
                            icon={<BookOpenIcon className="w-12 h-12"/>}
                            title={t('No recipes yet')}
                            message={t('Create your first recipe to see it listed here.')}
                            action={{
                                text: t('Create New Recipe'),
                                onClick: onNewRecipe
                            }}
                        />
                    ) : (
                        <EmptyState
                            icon={<BookOpenIcon className="w-12 h-12"/>}
                            title={t('No recipes match your search.')}
                            message={t('Try a different search term or create a new recipe.')}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default RecipesListPage;