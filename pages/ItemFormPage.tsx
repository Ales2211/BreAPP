

import React, { useState, useEffect, useMemo } from 'react';
import { MasterItem, Category, Supplier, Unit } from '../types';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { ArrowLeftIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface ItemFormPageProps {
  item: MasterItem | null;
  categories: Category[];
  suppliers: Supplier[];
  onSave: (item: MasterItem | Omit<MasterItem, 'id'>) => void;
  onBack: () => void;
}

const getBlankItem = (defaultCategoryId: string): Omit<MasterItem, 'id'> => ({
    name: '',
    categoryId: defaultCategoryId,
    unit: 'Kg',
    format: undefined,
    containerVolumeL: undefined,
    defaultSupplierId: undefined,
    purchaseCost: undefined,
    salePrice: undefined,
    reorderPoint: undefined,
});

const ItemFormPage: React.FC<ItemFormPageProps> = ({ item, categories, suppliers, onSave, onBack }) => {
    const { t } = useTranslation();

    const groupedCategories = useMemo(() => {
        const parents = categories.filter(c => !c.parentCategoryId);
        const children = categories.filter(c => c.parentCategoryId);

        return parents.map(parent => ({
            ...parent,
            children: children.filter(child => child.parentCategoryId === parent.id)
                              .sort((a, b) => t(a.name).localeCompare(t(b.name)))
        })).sort((a, b) => t(a.name).localeCompare(t(b.name)));
    }, [categories, t]);

    const [formData, setFormData] = useState<MasterItem | Omit<MasterItem, 'id'>>(() => {
        const defaultCategory = groupedCategories[0]?.children[0]?.id || (categories.length > 0 ? categories[0].id : '');
        return item || getBlankItem(defaultCategory);
    });

    useEffect(() => {
        const defaultCategory = groupedCategories[0]?.children[0]?.id || (categories.length > 0 ? categories[0].id : '');
        setFormData(item || getBlankItem(defaultCategory));
    }, [item, categories, groupedCategories]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    }

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as MasterItem);
    }
    
    const isFinishedGood = useMemo(() => {
        const selectedCategory = categories.find(c => c.id === formData.categoryId);
        if (!selectedCategory) return false;

        if (selectedCategory.name === 'Finished Goods') return true;

        const parentCategory = categories.find(p => p.id === selectedCategory.parentCategoryId);
        return parentCategory?.name === 'Finished Goods';
    }, [formData.categoryId, categories]);

    return (
        <form onSubmit={handleSave} className="max-w-4xl mx-auto">
            <div className="flex items-center mb-4">
                <button type="button" onClick={onBack} className="p-1.5 mr-2 rounded-full hover:bg-color-border/50 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-color-text">
                    {('id' in formData && formData.id) ? t('Edit Item') : t('Create Item')}
                </h1>
            </div>
            
            <Card>
                <div className="space-y-4">
                    <Input label={t('Item Name')} name="name" value={formData.name} onChange={handleChange} required />
                    
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-500">{t('Category')}</label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className="w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:border-color-accent focus:ring-1 focus:ring-color-accent transition-colors"
                        >
                            {groupedCategories.map(parent => (
                                <optgroup key={parent.id} label={t(parent.name)}>
                                    {parent.children.map(child => (
                                        <option key={child.id} value={child.id}>{t(child.name)}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label={t('Unit')} name="unit" value={formData.unit} onChange={handleChange}>
                            <option value="Kg">Kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="pcs">pcs</option>
                        </Select>

                        <Input label={t('Format')} name="format" type="number" value={formData.format || ''} onChange={handleNumericChange} unit={formData.unit}/>
                    </div>

                    {isFinishedGood && (
                         <Input label={t('Container Volume (L)')} name="containerVolumeL" type="number" step="any" value={formData.containerVolumeL || ''} onChange={handleNumericChange} unit="L"/>
                    )}

                    <Select label={t('Default Supplier')} name="defaultSupplierId" value={formData.defaultSupplierId || ''} onChange={handleChange}>
                        <option value="">{t('Select a supplier...')}</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('Purchase Cost')} name="purchaseCost" type="number" step="any" value={formData.purchaseCost || ''} onChange={handleNumericChange} unit={`€ / ${formData.unit}`} />
                        <Input label={t('Sale Price')} name="salePrice" type="number" step="any" value={formData.salePrice || ''} onChange={handleNumericChange} unit={`€ / ${formData.unit}`} />
                    </div>

                    <Input label={t('Reorder Point')} name="reorderPoint" type="number" step="any" value={formData.reorderPoint || ''} onChange={handleNumericChange} unit={formData.unit}/>
                </div>
            </Card>

            <div className="mt-8 flex justify-end space-x-4">
                 <button type="button" onClick={onBack} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                    {t('Cancel')}
                </button>
                <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    {t('Save')}
                </button>
            </div>
        </form>
    );
};

export default ItemFormPage;
