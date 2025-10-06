import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/ui/Modal';
import { Category } from '../types';
import { PlusCircleIcon, PencilIcon, TrashIcon } from '../components/Icons';

// --- Modal for Creating/Editing Categories ---
const CategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Omit<Category, 'id'> | Category) => void;
    category: Omit<Category, 'id'> | Category | null;
    allCategories: Category[];
    t: (key: string) => string;
}> = ({ isOpen, onClose, onSave, category, allCategories, t }) => {
    const [formData, setFormData] = useState(category || { name: '', parentCategoryId: undefined });

    useEffect(() => {
        if (isOpen) {
            setFormData(category || { name: '', parentCategoryId: undefined });
        }
    }, [isOpen, category]);

    const parentCategories = useMemo(() => allCategories.filter(c => !c.parentCategoryId), [allCategories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        const categoryToSave = {
            ...formData,
            parentCategoryId: formData.parentCategoryId || undefined
        };
        onSave(categoryToSave);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={('id' in formData && formData.id) ? t('Edit Category') : t('Create Category')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label={t('Category Name')}
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                />
                <Select
                    label={t('Parent Category')}
                    value={formData.parentCategoryId || ''}
                    onChange={(e) => setFormData(p => ({ ...p, parentCategoryId: e.target.value }))}
                >
                    <option value="">{t('No parent (is a main category)')}</option>
                    {parentCategories.map(p => (
                        <option key={p.id} value={p.id}>{t(p.name)}</option>
                    ))}
                </Select>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                    <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Save')}</button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main Settings Page Component ---

interface SettingsPageProps {
  categories: Category[];
  onSaveCategory: (category: Omit<Category, 'id'> | Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ categories, onSaveCategory, onDeleteCategory }) => {
    const { t, language, setLanguage } = useTranslation();
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    
    const groupedCategories = useMemo(() => {
        const parents = categories.filter(c => !c.parentCategoryId);
        const children = categories.filter(c => c.parentCategoryId);

        return parents.map(parent => ({
            ...parent,
            children: children.filter(child => child.parentCategoryId === parent.id)
                              .sort((a, b) => t(a.name).localeCompare(t(b.name)))
        })).sort((a, b) => t(a.name).localeCompare(t(b.name)));
    }, [categories, t]);
    
    const handleNewCategory = () => {
        setSelectedCategory(null);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setIsCategoryModalOpen(true);
    };
    
    const handleDeleteRequest = (category: Category) => {
        setCategoryToDelete(category);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (categoryToDelete) {
            onDeleteCategory(categoryToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setCategoryToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Settings')}</h1>

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={onSaveCategory}
                category={selectedCategory}
                allCategories={categories}
                t={t}
            />
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Category')}
                message={`${t('Are you sure you want to delete category')} "${t(categoryToDelete?.name || '')}"? ${t('Deleting a category will also delete all its subcategories. This action cannot be undone.')}`}
            />
            
            <div className="max-w-4xl space-y-6">
                <Card title={t('Language Settings')}>
                    <p className="text-gray-500 mb-4">{t('Select your preferred language for the application interface.')}</p>
                    <Select
                        label={t('Language')}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'it')}
                    >
                        <option value="en">{t('English')}</option>
                        <option value="it">{t('Italian')}</option>
                    </Select>
                </Card>

                <Card title={t('Category Management')}>
                    <p className="text-gray-500 mb-4">{t('Manage your product categories and subcategories.')}</p>
                    <div className="space-y-4">
                        {groupedCategories.map(parent => (
                            <div key={parent.id} className="bg-color-background/50 rounded-lg p-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-color-secondary">{t(parent.name)}</h4>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEditCategory(parent)} className="p-1 text-gray-400 hover:text-color-accent"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteRequest(parent)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <ul className="mt-2 ml-4 space-y-1 list-disc list-inside">
                                    {parent.children.map(child => (
                                        <li key={child.id} className="text-sm flex justify-between items-center">
                                            <span>{t(child.name)}</span>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleEditCategory(child)} className="p-1 text-gray-400 hover:text-color-accent"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteRequest(child)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                     <button onClick={handleNewCategory} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>{t('Add New Category')}</span>
                     </button>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;