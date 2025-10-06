import React, { useState, useMemo } from 'react';
import { MasterItem, Category } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, TagIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';

interface ItemsPageProps {
  masterItems: MasterItem[];
  categories: Category[];
  onNewItem: () => void;
  onEditItem: (item: MasterItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const ItemCard: React.FC<{ item: MasterItem, categoryName: string, onEdit: () => void, onDelete: () => void, t: (key: string) => string }> = ({ item, categoryName, onEdit, onDelete, t }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            onClick={onEdit}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
            role="button"
            tabIndex={0}
            aria-label={`Edit item ${item.name}`}
            className="bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-color-accent">{item.name}</h3>
                    <p className="text-sm text-gray-500"><span className="font-semibold">{categoryName}</span></p>
                    <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mt-2">
                        <span>{t('Unit')}: {item.unit}</span>
                        {item.format && <span>{t('Format')}: {item.format} {item.unit}</span>}
                    </div>
                </div>
                 <div className="flex space-x-2">
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-red-500"
                        aria-label={`Delete item ${item.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ItemsPage: React.FC<ItemsPageProps> = ({ masterItems, categories, onNewItem, onEditItem, onDeleteItem }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return 'N/A';
        
        if (category.parentCategoryId) {
            const parent = categories.find(p => p.id === category.parentCategoryId);
            if (parent) {
                return `${t(parent.name)} - ${t(category.name)}`;
            }
        }
        return t(category.name);
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) {
            return masterItems;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return masterItems.filter(item => 
            item.name.toLowerCase().includes(lowercasedTerm) ||
            getCategoryName(item.categoryId).toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, masterItems, categories, t]);
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Item Master Data')}</h1>
                <button onClick={onNewItem} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Master Item')}</span>
                </button>
            </div>
            
            {masterItems.length > 0 && (
                <div className="mb-4">
                    <Input
                        placeholder={t('Search by name or category...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {filteredItems.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredItems.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item} 
                            categoryName={getCategoryName(item.categoryId)}
                            onEdit={() => onEditItem(item)} 
                            onDelete={() => onDeleteItem(item.id)} 
                            t={t} 
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    {masterItems.length === 0 ? (
                         <EmptyState 
                            icon={<TagIcon className="w-12 h-12"/>}
                            title={t('No items found')}
                            message={t('Create your first master item, like malts or hops, to get started.')}
                            action={{
                                text: t('Create New Item'),
                                onClick: onNewItem
                            }}
                        />
                    ) : (
                        <EmptyState
                            icon={<TagIcon className="w-12 h-12"/>}
                            title={t('No items match your search.')}
                            message={t('Try a different search term or create a new item.')}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default ItemsPage;