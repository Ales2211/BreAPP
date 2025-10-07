import React, { useState, useEffect, useMemo } from 'react';
import { MasterItem, Category, Supplier } from '../types';
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
        const itemCategory = categories.find(c => c.id === formData.categoryId);
        if (!itemCategory) return false;

        const finishedGoodsCategory = categories.find(c => c.name === 'Finished Goods');
        if (!finishedGoodsCategory) return false;

        return itemCategory.parentCategoryId === finishedGoodsCategory.id || itemCategory.id === finishedGoodsCategory.id;
    }, [formData.categoryId, categories]);
    
    const units: MasterItem['unit'][] = ['Kg', 'g', 'Lt', 'pcs'];

    return (
        <form onSubmit={handleSave} className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border/50 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-3xl font-bold text-color-text">
                    {item ? t('Edit Item') : t('Create Item')}
                </h1>
            </div>
            
            <Card title={t('General Information')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input containerClassName="md:col-span-2" label={t('Item Name')} name="name" value={formData.name} onChange={handleChange} required />
                    
                    <Select label={t('Category')} name="categoryId" value={formData.categoryId} onChange={handleChange}>
                        {groupedCategories.map(parent => (
                            <optgroup key={parent.id} label={t(parent.name)}>
                                {parent.children.map(child => (
                                    <option key={child.id} value={child.id}>{t(child.name)}</option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                    
                    {!isFinishedGood && (
                        <Select 
                            label={t('Default Supplier')}
                            name="defaultSupplierId" 
                            value={formData.defaultSupplierId || ''} 
                            onChange={handleChange} 
                        >
                            <option value="">{t('None')}</option>
                            {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                        </Select>
                    )}

                    <Select label={t('Unit')} name="unit" value={formData.unit} onChange={handleChange}>
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </Select>

                    <Input 
                        label={`${t('Format')} (${formData.unit})`}
                        name="format" 
                        type="number"
                        step="any"
                        value={formData.format ?? ''} 
                        onChange={handleNumericChange} 
                    />
                    
                     {isFinishedGood && (
                        <Input 
                            label={`${t('Container Volume')} (L)`}
                            name="containerVolumeL" 
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.containerVolumeL ?? ''} 
                            onChange={handleNumericChange} 
                        />
                    )}

                    <Input 
                        label={`${t('Purchase Cost')} (€/${formData.unit})`}
                        name="purchaseCost" 
                        type="number"
                        step="0.01"
                        value={formData.purchaseCost ?? ''} 
                        onChange={handleNumericChange} 
                    />
                    <Input 
                        label={`${t('Sale Price')} (€/${formData.unit})`}
                        name="salePrice" 
                        type="number"
                        step="0.01"
                        value={formData.salePrice ?? ''} 
                        onChange={handleNumericChange} 
                    />
                     <Input 
                        label={t('Reorder Point')}
                        name="reorderPoint" 
                        type="number"
                        step="any"
                        value={formData.reorderPoint ?? ''} 
                        onChange={handleNumericChange} 
                        unit={formData.unit}
                        containerClassName="md:col-span-2"
                    />
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