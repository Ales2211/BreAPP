
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MasterItem, Category, Ingredient, BoilWhirlpoolIngredient, MashStep, FermentationStep, TankIngredient, PackagedItemLink, QualityControlSpecification, QualityControlValueSpec, AdministrationSettings } from '../types';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, MaltIcon, HopsIcon, YeastIcon, BookOpenIcon, WrenchIcon, ThermometerIcon, DropletIcon, BottleIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getBlankRecipe = (): Omit<Recipe, 'id'> => ({
    name: '', style: '',
    shelfLifeDays: 90,
    qualityControlSpec: {
        og: { target: 0 },
        fg: { target: 0 },
        abv: { target: 0 },
        ibu: { target: 0 },
        liters: { target: 0 },
        finalPh: { target: 0 },
        preFermentationPh: { target: 0 },
    },
    mashIngredients: [],
    boilWhirlpoolIngredients: [],
    tankIngredients: [],
    packagingIngredients: [],
    mashSteps: [],
    fermentationSteps: [],
    packagedItems: [],
    processParameters: {
        mashWaterMainsL: 0, mashWaterMainsMicroSiemens: 0,
        mashWaterRoL: 0, mashWaterRoMicroSiemens: 0,
        spargeWaterL: 0, spargeWaterMicroSiemens: 0, spargeWaterPh: 0,
        maltMilling: 0, expectedMashPh: 0, expectedIodineTime: 0,
        transferDuration: 0, recirculationDuration: 0, filtrationDuration: 0,
        firstWortPlato: 0, firstWortPh: 0, lastWortPlato: 0, lastWortPh: 0,
        preBoilLiters: 0, preBoilPlato: 0, preBoilPh: 0,
        postBoilLiters: 0, postBoilPlato: 0, postBoilPh: 0,
        boilDuration: 0, whirlpoolDuration: 0, whirlpoolRestDuration: 0, coolingDuration: 0,
        packagingYield: 80,
    },
    additionalCosts: {
        other: 0,
    },
    notes: ''
});

// A more flexible ingredient panel
interface IngredientPanelProps<T extends Ingredient> {
    items: T[];
    masterItems: MasterItem[];
    categories: Category[];
    onUpdate: (items: T[]) => void;
    t: (key: string) => string;
    validCategoryNames: string[];
    panelType: 'mash' | 'boil' | 'tank' | 'packaging';
    totalWeightForPercentage?: number;
    categoryForPercentage?: string;
    litersForGl?: number;
}

// Fix: Extracted props to a type alias to resolve TSX issue with generic components and 'key' prop.
type IngredientRowProps<T extends Ingredient> = {
    item: T;
    index: number;
    onUpdate: (index: number, field: keyof T, value: any) => void;
    onRemove: (id: string) => void;
} & Omit<IngredientPanelProps<T>, 'items' | 'onUpdate'>;

// Fix: The generic functional component was causing a TypeScript error with the `key` prop when wrapped in React.memo.
// Using a named function expression inside React.memo allows TypeScript to correctly infer the generic types
// and handle the `key` prop without it being part of the component's own props, thus resolving the error.
const IngredientRow = React.memo(function IngredientRow<T extends Ingredient>({ 
    item, index, onUpdate, onRemove, masterItems, categories, t, validCategoryNames, panelType,
    totalWeightForPercentage, categoryForPercentage, litersForGl 
}: IngredientRowProps<T>) {
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    
    const categoryIdForPercentage = useMemo(() => categories.find(c => c.name === categoryForPercentage)?.id, [categories, categoryForPercentage]);
    const hopsCategoryId = useMemo(() => categories.find(c => c.name === 'Hops')?.id, [categories]);

    const filteredMasterItems = useMemo(() => {
        const validCategoryIds = categories.filter(c => validCategoryNames.includes(c.name)).map(c => c.id);
        return masterItems.filter(mi => 
            validCategoryIds.includes(mi.categoryId) && 
            mi.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, masterItems, categories, validCategoryNames]);

    const handleSelect = (mi: MasterItem) => {
        onUpdate(index, 'masterItemId' as keyof T, mi.id);
        setIsFocused(false);
    };

    const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
    const isWhirlpool = panelType === 'boil' && (item as unknown as BoilWhirlpoolIngredient).type === 'Whirlpool';
    
    const renderItemDetails = () => {
        if (!masterItem) return null;
        const sackInfo = (masterItem.format && masterItem.format > 0) ? `≈ ${(item.quantity / masterItem.format).toFixed(1)} ${t('sacks')}` : null;
        const calcInfo = (() => {
            const calcs = [];
            if (categoryIdForPercentage && masterItem.categoryId === categoryIdForPercentage && totalWeightForPercentage && totalWeightForPercentage > 0) {
                const percentage = (item.quantity / totalWeightForPercentage * 100).toFixed(1);
                calcs.push(`${percentage}%`);
            }
            if (masterItem.categoryId === hopsCategoryId && litersForGl && litersForGl > 0) {
                const gl = (item.quantity * 1000 / litersForGl).toFixed(2); // Convert Kg to g
                calcs.push(`${gl} g/L`);
            }
            return calcs.length > 0 ? calcs.join(' | ') : null;
        })();
        const allDetails = [sackInfo, calcInfo].filter(Boolean);
        if (allDetails.length === 0) return null;
        return <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{allDetails.join(' | ')}</p>;
    };

    const gridConfig = {
        mash: 'grid-cols-12',
        boil: 'grid-cols-12',
        tank: 'grid-cols-12',
        packaging: 'grid-cols-12'
    };

    return (
        <div className={`grid ${gridConfig[panelType]} gap-x-2 gap-y-1 items-start bg-color-background/50 p-2 rounded-md`}>
            <div className={`relative ${
                panelType === 'mash' || panelType === 'packaging' ? 'col-span-12 md:col-span-8' :
                panelType === 'boil' ? 'col-span-12 md:col-span-4' :
                'col-span-12 md:col-span-7'
            }`}>
                <Input 
                    placeholder={t('Search ingredient...')}
                    value={isFocused ? searchTerm : masterItem?.name || ''}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (item.masterItemId) onUpdate(index, 'masterItemId' as keyof T, '' as any);
                    }}
                    onFocus={() => { setSearchTerm(masterItem?.name || ''); setIsFocused(true); }}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    className="py-1"
                />
                {isFocused && (
                    <ul className="absolute z-10 w-full bg-color-surface border border-color-border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {filteredMasterItems.map(mi => (
                            <li key={mi.id} onMouseDown={() => handleSelect(mi)} className="px-3 py-2 hover:bg-color-accent hover:text-white cursor-pointer text-sm">
                                {mi.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="col-span-8 md:col-span-3">
                <Input 
                    type="number" step="any" min="0"
                    value={item.quantity}
                    onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                    unit={masterItem?.unit}
                    className="py-1"
                />
                {renderItemDetails()}
            </div>

            {panelType === 'boil' && (
                <>
                    <div className="col-span-4 md:col-span-2">
                        <Select value={(item as unknown as BoilWhirlpoolIngredient).type} onChange={e => onUpdate(index, 'type' as any, e.target.value)} className="py-1 h-[34px]">
                            <option value="Boil">{t('Boil')}</option>
                            <option value="Whirlpool">{t('Whirlpool')}</option>
                        </Select>
                    </div>
                    <div className="col-span-4 md:col-span-1">
                        <Input type="number" value={(item as unknown as BoilWhirlpoolIngredient).timing} onChange={e => onUpdate(index, 'timing' as any, parseInt(e.target.value, 10))} unit="min" className="py-1" />
                    </div>
                    <div className="col-span-4 md:col-span-1">
                        {isWhirlpool && <Input type="number" value={(item as unknown as BoilWhirlpoolIngredient).temperature || ''} onChange={e => onUpdate(index, 'temperature' as any, parseInt(e.target.value, 10))} unit="°C" className="py-1" />}
                    </div>
                </>
            )}
            {panelType === 'tank' && (
                <div className="col-span-4 md:col-span-1">
                    <Input type="number" value={(item as unknown as TankIngredient).day} onChange={e => onUpdate(index, 'day' as any, parseInt(e.target.value, 10))} className="py-1" />
                </div>
            )}

            <div className="col-span-4 md:col-span-1 flex items-center justify-end h-full">
                <button type="button" onClick={() => onRemove(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors">
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
});

interface RecipeFormPageProps {
  recipe: Recipe | null;
  masterItems: MasterItem[];
  categories: Category[];
  administrationSettings: AdministrationSettings;
  // Fix: Update the onSave prop type to accept both new and existing recipes.
  onSave: (recipe: Recipe | Omit<Recipe, 'id'>) => void;
  onBack: () => void;
}

const RecipeFormPage: React.FC<RecipeFormPageProps> = ({ recipe, masterItems, categories, administrationSettings, onSave, onBack }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Recipe | Omit<Recipe, 'id'>>(() => recipe || getBlankRecipe());
    const [activeTab, setActiveTab] = useState('General');

    const finishedGoodsMasterItems = useMemo(() => {
        const fgParentCat = categories.find(c => c.name === 'Finished Goods');
        if (!fgParentCat) return [];
        const fgCategoryIds = new Set<string>([fgParentCat.id, ...categories.filter(c => c.parentCategoryId === fgParentCat.id).map(c => c.id)]);
        return masterItems.filter(mi => fgCategoryIds.has(mi.categoryId));
    }, [masterItems, categories]);

    useEffect(() => {
        setFormData(recipe || getBlankRecipe());
    }, [recipe]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = (type === 'number' && value !== '') ? parseFloat(value) : value;
        setFormData(prev => ({...prev, [name]: parsedValue }));
    };

    const handleProcessParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = (value !== '') ? parseFloat(value) : 0;
        setFormData(prev => ({ ...prev, processParameters: { ...prev.processParameters, [name]: parsedValue } }));
    };

    const handleAdditionalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = (value !== '') ? parseFloat(value) : 0;
        setFormData(prev => ({ ...prev, additionalCosts: { ...prev.additionalCosts, [name]: parsedValue } }));
    };

    const handleUpdateList = <T,>(key: keyof Recipe, newList: T[]) => {
        setFormData(prev => ({...prev, [key]: newList} as unknown as Recipe | Omit<Recipe, 'id'>));
    };

    const handleQcChange = (field: keyof QualityControlSpecification, subfield: keyof QualityControlValueSpec, value: string) => {
        const parsedValue = value === '' ? undefined : parseFloat(value);
        setFormData(prev => {
            const spec = (prev.qualityControlSpec || {}) as QualityControlSpecification;
            const fieldSpec = (spec[field] || {}) as QualityControlValueSpec;
            return { ...prev, qualityControlSpec: { ...spec, [field]: { ...fieldSpec, [subfield]: parsedValue } } };
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Fix: Removed incorrect type assertion. `formData` is already the correct type for `onSave`.
        onSave(formData);
    };
    
    const totalGristWeight = useMemo(() => formData.mashIngredients.reduce((sum, ing) => sum + ing.quantity, 0), [formData.mashIngredients]);
    
    const { 
        rawMaterialCost, 
        packagingCost, 
        otherRecipeCosts,
        operationalCostsPerBatch,
        calculatedExciseDuty, 
        grandTotalCost, 
        costPerLiter 
    } = useMemo(() => {
        // Calculate global operational costs per batch
        const { 
            annualBatches, annualManpowerCost, annualGasCost, annualRentCost, annualWaterCost,
            annualDetergentsCost, annualCo2Cost 
        } = administrationSettings;
        const opCostsPerBatch = annualBatches > 0 
            ? (
                (annualManpowerCost || 0) + 
                (annualGasCost || 0) + 
                (annualRentCost || 0) + 
                (annualWaterCost || 0) +
                (annualDetergentsCost || 0) +
                (annualCo2Cost || 0)
              ) / annualBatches 
            : 0;
            
        const rmCost = [...formData.mashIngredients, ...formData.boilWhirlpoolIngredients, ...formData.tankIngredients]
            .reduce((acc, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                return acc + (ing.quantity * (item?.purchaseCost || 0));
            }, 0);

        const pkgCost = formData.packagingIngredients.reduce((acc, ing) => {
            const item = masterItems.find(mi => mi.id === ing.masterItemId);
            return acc + (ing.quantity * (item?.purchaseCost || 0));
        }, 0);
        
        const otherCosts = Object.values(formData.additionalCosts || {}).reduce((sum: number, cost) => sum + (Number(cost) || 0), 0);
        
        const packagedLiters = (formData.qualityControlSpec.liters.target || 0) * ((formData.processParameters.packagingYield || 0) / 100);
        
        const exciseDuty = (formData.qualityControlSpec.og.target || 0) * (packagedLiters / 100) * (administrationSettings.exciseDutyRate || 0);

        const grandTotal = rmCost + pkgCost + otherCosts + opCostsPerBatch + exciseDuty;
        
        const cpl = packagedLiters > 0 ? grandTotal / packagedLiters : 0;
        
        return { 
            rawMaterialCost: rmCost,
            packagingCost: pkgCost,
            otherRecipeCosts: otherCosts,
            operationalCostsPerBatch: opCostsPerBatch,
            calculatedExciseDuty: exciseDuty,
            grandTotalCost: grandTotal,
            costPerLiter: cpl 
        };
    }, [formData, masterItems, administrationSettings]);

    const tabs = ['General', 'Raw Materials', 'Water', 'Process', 'Finished Product', 'Costs'];
    
    const targets = [
        { key: 'og', labelKey: 'OriginalGravity', unit: '°P', step: 0.1 },
        { key: 'fg', labelKey: 'FinalGravity', unit: '°P', step: 0.1 },
        { key: 'abv', labelKey: 'AlcoholByVolume', unit: '%', step: 0.1 },
        { key: 'ibu', labelKey: 'Bitterness', unit: 'IBU', step: 1 },
        { key: 'liters', labelKey: 'VolumeInTank', unit: 'L', step: 1 },
        { key: 'preFermentationPh', labelKey: 'PreFermentationpH', unit: 'pH', step: 0.01 },
        { key: 'finalPh', labelKey: 'FinalpH', unit: 'pH', step: 0.01 },
    ];
    
    const allIngredientsForCosting = useMemo(() => {
        return [
            ...formData.mashIngredients.map(i => ({ ...i, stage: 'Mash' })),
            ...formData.boilWhirlpoolIngredients.map(i => ({ ...i, stage: 'Boil & Whirlpool' })),
            ...formData.tankIngredients.map(i => ({ ...i, stage: 'Fermentation' }))
        ];
    }, [formData.mashIngredients, formData.boilWhirlpoolIngredients, formData.tankIngredients]);
    
    const totalPackagingSplit = useMemo(() => formData.packagedItems.reduce((sum, item) => sum + (item.packagingSplit || 0), 0), [formData.packagedItems]);


    return (
        <form onSubmit={handleSave} className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center">
                    <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border/50 transition-colors">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                    <h1 className="text-3xl font-bold text-color-text">
                        {recipe ? t('Edit Recipe') : t('Create Recipe')}
                    </h1>
                </div>
                <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    {t('Save')}
                </button>
            </div>
            
            <div className="border-b border-color-border mb-6 flex-shrink-0">
                <nav className="flex space-x-4">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-1 text-sm font-semibold transition-colors ${
                                activeTab === tab
                                ? 'border-b-2 border-color-accent text-color-accent'
                                : 'text-gray-500 hover:text-color-text'
                            }`}
                        >
                            {t(tab)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {activeTab === 'General' && (
                    <div className="space-y-6">
                         <Card title={t('General Information')} icon={<BookOpenIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input containerClassName="md:col-span-2" label={t('Recipe Name')} name="name" value={formData.name} onChange={handleChange} required />
                                <Input label={t('Style')} name="style" value={formData.style} onChange={handleChange} />
                                <Input label={t('Shelf Life (days)')} name="shelfLifeDays" type="number" value={formData.shelfLifeDays || ''} onChange={handleChange} />
                            </div>
                        </Card>
                        <Card title={t('Targets')} icon={<ThermometerIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {targets.map(({ key, labelKey, unit, step }) => (
                                    <div key={key} className="bg-color-background/60 p-4 rounded-lg border border-color-border/30">
                                        <label className="block text-base font-semibold text-color-secondary mb-3">{t(labelKey)}</label>
                                        
                                        <div className="relative mb-4">
                                            <Input
                                                type="number"
                                                step={step}
                                                value={formData.qualityControlSpec?.[key as keyof QualityControlSpecification]?.target || ''}
                                                onChange={e => handleQcChange(key as keyof QualityControlSpecification, 'target', e.target.value)}
                                                className="text-center text-xl font-mono py-2.5"
                                                aria-label={`${t('Target')} ${t(labelKey)}`}
                                            />
                                            <span className="absolute top-1/2 -translate-y-1/2 right-3 text-sm text-gray-400 pointer-events-none">{unit}</span>
                                        </div>
                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1 text-center">{t('Min')}</label>
                                                <Input
                                                    type="number"
                                                    step={step}
                                                    value={formData.qualityControlSpec?.[key as keyof QualityControlSpecification]?.min ?? ''}
                                                    onChange={e => handleQcChange(key as keyof QualityControlSpecification, 'min', e.target.value)}
                                                    placeholder="-"
                                                    className="text-center font-mono"
                                                    aria-label={`${t('Min')} ${t(labelKey)}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1 text-center">{t('Max')}</label>
                                                <Input
                                                    type="number"
                                                    step={step}
                                                    value={formData.qualityControlSpec?.[key as keyof QualityControlSpecification]?.max ?? ''}
                                                    onChange={e => handleQcChange(key as keyof QualityControlSpecification, 'max', e.target.value)}
                                                    placeholder="-"
                                                    className="text-center font-mono"
                                                    aria-label={`${t('Max')} ${t(labelKey)}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'Raw Materials' && (
                    <div className="space-y-6">
                        <Card title={t('Mash Ingredients')} icon={<MaltIcon className="w-5 h-5" />}>
                           {formData.mashIngredients.length > 0 && <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-2 px-2"><div className="col-span-8">{t('Ingredient')}</div><div className="col-span-3">{t('Quantity')}</div><div className="col-span-1 text-right">{t('Actions')}</div></div>}
                            <div className="space-y-2">
                                {formData.mashIngredients.map((item, index) => <IngredientRow key={item.id} item={item} index={index} onUpdate={(idx, field, value) => handleUpdateList('mashIngredients', formData.mashIngredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))} onRemove={id => handleUpdateList('mashIngredients', formData.mashIngredients.filter(ing => ing.id !== id))} masterItems={masterItems} categories={categories} t={t} validCategoryNames={['Malt', 'Adjunct', 'Sugar', 'Category_Other']} panelType="mash" totalWeightForPercentage={totalGristWeight} categoryForPercentage="Malt" />)}
                            </div>
                            <button type="button" onClick={() => handleUpdateList('mashIngredients', [...formData.mashIngredients, { id: generateId(), masterItemId: '', quantity: 0 }])} className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors">
                                <PlusCircleIcon className="w-5 h-5"/><span>{t('Add Mash Ingredient')}</span>
                            </button>
                        </Card>
                         <Card title={t('Boil & Whirlpool')} icon={<HopsIcon className="w-5 h-5" />}>
                            {formData.boilWhirlpoolIngredients.length > 0 && <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-2 px-2"><div className="col-span-4">{t('Ingredient')}</div><div className="col-span-3">{t('Quantity')}</div><div className="col-span-2">{t('Type')}</div><div className="col-span-1">{t('Timing')}</div><div className="col-span-1">{t('Temp.')}</div><div className="col-span-1 text-right">{t('Actions')}</div></div>}
                             <div className="space-y-2">
                                {formData.boilWhirlpoolIngredients.map((item, index) => <IngredientRow key={item.id} item={item} index={index} onUpdate={(idx, field, value) => handleUpdateList('boilWhirlpoolIngredients', formData.boilWhirlpoolIngredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))} onRemove={id => handleUpdateList('boilWhirlpoolIngredients', formData.boilWhirlpoolIngredients.filter(ing => ing.id !== id))} masterItems={masterItems} categories={categories} t={t} validCategoryNames={['Hops', 'Spices', 'Sugar', 'Category_Other']} panelType="boil" litersForGl={formData.qualityControlSpec.liters.target} />)}
                            </div>
                            <button type="button" onClick={() => handleUpdateList('boilWhirlpoolIngredients', [...formData.boilWhirlpoolIngredients, { id: generateId(), masterItemId: '', quantity: 0, type: 'Boil', timing: 60 }])} className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors">
                                <PlusCircleIcon className="w-5 h-5"/><span>{t('Add Boil/Whirlpool Ingredient')}</span>
                            </button>
                        </Card>
                         <Card title={t('Tank Ingredients')} icon={<YeastIcon className="w-5 h-5" />}>
                             {formData.tankIngredients.length > 0 && <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-2 px-2"><div className="col-span-7">{t('Ingredient')}</div><div className="col-span-3">{t('Quantity')}</div><div className="col-span-1">{t('Day')}</div><div className="col-span-1 text-right">{t('Actions')}</div></div>}
                             <div className="space-y-2">
                                {formData.tankIngredients.map((item, index) => <IngredientRow key={item.id} item={item} index={index} onUpdate={(idx, field, value) => handleUpdateList('tankIngredients', formData.tankIngredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))} onRemove={id => handleUpdateList('tankIngredients', formData.tankIngredients.filter(ing => ing.id !== id))} masterItems={masterItems} categories={categories} t={t} validCategoryNames={['Yeast', 'Hops', 'Spices', 'Adjunct', 'Category_Other']} panelType="tank" litersForGl={formData.qualityControlSpec.liters.target} />)}
                            </div>
                            <button type="button" onClick={() => handleUpdateList('tankIngredients', [...formData.tankIngredients, { id: generateId(), masterItemId: '', quantity: 0, day: 0 }])} className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors">
                                <PlusCircleIcon className="w-5 h-5"/><span>{t('Add Tank Ingredient')}</span>
                            </button>
                        </Card>
                    </div>
                )}
                
                {activeTab === 'Water' && (
                     <Card title={t('Water Profile')} icon={<DropletIcon className="w-5 h-5"/>}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label={t('Mash Water (Mains, L)')} name="mashWaterMainsL" type="number" step="any" value={formData.processParameters.mashWaterMainsL} onChange={handleProcessParamChange} />
                            <Input label={t('Mash Water (Mains, µS/cm)')} name="mashWaterMainsMicroSiemens" type="number" step="any" value={formData.processParameters.mashWaterMainsMicroSiemens} onChange={handleProcessParamChange} />
                            <Input label={t('Mash Water (RO, L)')} name="mashWaterRoL" type="number" step="any" value={formData.processParameters.mashWaterRoL} onChange={handleProcessParamChange} />
                            <Input label={t('Mash Water (RO, µS/cm)')} name="mashWaterRoMicroSiemens" type="number" step="any" value={formData.processParameters.mashWaterRoMicroSiemens} onChange={handleProcessParamChange} />
                            <Input label={t('Sparge Water (L)')} name="spargeWaterL" type="number" step="any" value={formData.processParameters.spargeWaterL} onChange={handleProcessParamChange} />
                            <Input label={t('Sparge Water (µS/cm)')} name="spargeWaterMicroSiemens" type="number" step="any" value={formData.processParameters.spargeWaterMicroSiemens} onChange={handleProcessParamChange} />
                            <Input label={t('Sparge Water pH')} name="spargeWaterPh" type="number" step="0.01" value={formData.processParameters.spargeWaterPh} onChange={handleProcessParamChange} />
                        </div>
                    </Card>
                )}

                {activeTab === 'Process' && (
                    <div className="space-y-6">
                        <Card title={t('Mash Steps')} icon={<MaltIcon className="w-5 h-5"/>}>
                            <div className="space-y-2">
                                {formData.mashSteps.map((step, index) => (
                                    <div key={step.id} className="grid grid-cols-12 gap-2 items-end bg-color-background/50 p-2 rounded-md">
                                        <div className="col-span-4"><Input label={t('Temperature (°C)')} type="number" value={step.temperature} onChange={(e) => handleUpdateList('mashSteps', formData.mashSteps.map((s, i) => i === index ? { ...s, temperature: parseFloat(e.target.value) || 0 } : s))} /></div>
                                        <div className="col-span-4"><Input label={t('Duration (min)')} type="number" value={step.duration} onChange={(e) => handleUpdateList('mashSteps', formData.mashSteps.map((s, i) => i === index ? { ...s, duration: parseInt(e.target.value, 10) || 0 } : s))} /></div>
                                        <div className="col-span-3"><Select label={t('Type')} value={step.type} onChange={(e) => handleUpdateList('mashSteps', formData.mashSteps.map((s, i) => i === index ? { ...s, type: e.target.value as MashStep['type'] } : s))}><option value="Infusion">{t('Infusion')}</option><option value="Decoction">{t('Decoction')}</option><option value="Temperature">{t('Temperature')}</option></Select></div>
                                        <div className="col-span-1 flex items-center justify-end"><button type="button" onClick={() => handleUpdateList('mashSteps', formData.mashSteps.filter(s => s.id !== step.id))} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button></div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => handleUpdateList('mashSteps', [...formData.mashSteps, { id: generateId(), temperature: 65, duration: 60, type: 'Infusion' }])} className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent"><PlusCircleIcon className="w-5 h-5"/><span>{t('Add Mash Step')}</span></button>
                        </Card>
                        <Card title={t('Fermentation Steps')} icon={<YeastIcon className="w-5 h-5"/>}>
                            <div className="space-y-2">
                                {formData.fermentationSteps.map((step, index) => (
                                    <div key={step.id} className="grid grid-cols-12 gap-2 items-end bg-color-background/50 p-2 rounded-md">
                                        <div className="col-span-12 md:col-span-5"><Input label={t('Step Description')} value={step.description} onChange={(e) => handleUpdateList('fermentationSteps', formData.fermentationSteps.map((s, i) => i === index ? { ...s, description: e.target.value } : s))} /></div>
                                        <div className="col-span-4 md:col-span-2"><Input label={t('Temperature (°C)')} type="number" value={step.temperature} onChange={(e) => handleUpdateList('fermentationSteps', formData.fermentationSteps.map((s, i) => i === index ? { ...s, temperature: parseFloat(e.target.value) || 0 } : s))} /></div>
                                        <div className="col-span-4 md:col-span-2"><Input label={t('Pressure (Bar)')} type="number" step="0.1" value={step.pressure} onChange={(e) => handleUpdateList('fermentationSteps', formData.fermentationSteps.map((s, i) => i === index ? { ...s, pressure: parseFloat(e.target.value) || 0 } : s))} /></div>
                                        <div className="col-span-4 md:col-span-2"><Input label={t('Days')} type="number" value={step.days} onChange={(e) => handleUpdateList('fermentationSteps', formData.fermentationSteps.map((s, i) => i === index ? { ...s, days: parseInt(e.target.value, 10) || 0 } : s))} /></div>
                                        <div className="col-span-12 md:col-span-1 flex items-center justify-end"><button type="button" onClick={() => handleUpdateList('fermentationSteps', formData.fermentationSteps.filter(s => s.id !== step.id))} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button></div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => handleUpdateList('fermentationSteps', [...formData.fermentationSteps, { id: generateId(), description: '', temperature: 18, pressure: 0, days: 7 }])} className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent"><PlusCircleIcon className="w-5 h-5"/><span>{t('Add Fermentation Step')}</span></button>
                        </Card>
                         <Card title={t('Process Parameters')} icon={<WrenchIcon className="w-5 h-5"/>}>
                            <div className="space-y-6">
                                <div><h4 className="text-md font-semibold text-color-secondary mb-2 border-b border-color-border/30 pb-1">{t('Grist & Mash')}</h4><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Input label={t('Malt Milling (%)')} name="maltMilling" type="number" step="any" value={formData.processParameters.maltMilling} onChange={handleProcessParamChange} /><Input label={t('Expected Mash pH')} name="expectedMashPh" type="number" step="0.01" value={formData.processParameters.expectedMashPh} onChange={handleProcessParamChange} /><Input label={t('Expected Iodine Time (min)')} name="expectedIodineTime" type="number" value={formData.processParameters.expectedIodineTime} onChange={handleProcessParamChange} /></div></div>
                                <div><h4 className="text-md font-semibold text-color-secondary mb-2 border-b border-color-border/30 pb-1">{t('Lauter')}</h4><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><Input label={t('Transfer Duration (min)')} name="transferDuration" type="number" value={formData.processParameters.transferDuration} onChange={handleProcessParamChange} /><Input label={t('Recirculation Duration (min)')} name="recirculationDuration" type="number" value={formData.processParameters.recirculationDuration} onChange={handleProcessParamChange} /><Input label={t('Filtration Duration (min)')} name="filtrationDuration" type="number" value={formData.processParameters.filtrationDuration} onChange={handleProcessParamChange} /><Input label={t('First Wort (°P)')} name="firstWortPlato" type="number" step="0.1" value={formData.processParameters.firstWortPlato} onChange={handleProcessParamChange} /><Input label={t('First Wort pH')} name="firstWortPh" type="number" step="0.01" value={formData.processParameters.firstWortPh} onChange={handleProcessParamChange} /><Input label={t('Last Wort (°P)')} name="lastWortPlato" type="number" step="0.1" value={formData.processParameters.lastWortPlato} onChange={handleProcessParamChange} /><Input label={t('Last Wort pH')} name="lastWortPh" type="number" step="0.01" value={formData.processParameters.lastWortPh} onChange={handleProcessParamChange} /></div></div>
                                <div><h4 className="text-md font-semibold text-color-secondary mb-2 border-b border-color-border/30 pb-1">{t('Boil & Cooling')}</h4><div className="grid grid-cols-2 sm:grid-cols-3 gap-4"><Input label={t('Pre-Boil (L)')} name="preBoilLiters" type="number" step="any" value={formData.processParameters.preBoilLiters} onChange={handleProcessParamChange} /><Input label={t('Pre-Boil (°P)')} name="preBoilPlato" type="number" step="0.1" value={formData.processParameters.preBoilPlato} onChange={handleProcessParamChange} /><Input label={t('Pre-boil pH')} name="preBoilPh" type="number" step="0.01" value={formData.processParameters.preBoilPh} onChange={handleProcessParamChange} /><Input label={t('Post-Boil (L)')} name="postBoilLiters" type="number" step="any" value={formData.processParameters.postBoilLiters} onChange={handleProcessParamChange} /><Input label={t('Post-Boil (°P)')} name="postBoilPlato" type="number" step="0.1" value={formData.processParameters.postBoilPlato} onChange={handleProcessParamChange} /><Input label={t('Post-Boil pH')} name="postBoilPh" type="number" step="0.01" value={formData.processParameters.postBoilPh} onChange={handleProcessParamChange} /><Input label="Boil Duration (min)" name="boilDuration" type="number" value={formData.processParameters.boilDuration} onChange={handleProcessParamChange} /><Input label="Whirlpool Duration (min)" name="whirlpoolDuration" type="number" value={formData.processParameters.whirlpoolDuration} onChange={handleProcessParamChange} /><Input label="Whirlpool Rest (min)" name="whirlpoolRestDuration" type="number" value={formData.processParameters.whirlpoolRestDuration} onChange={handleProcessParamChange} /><Input label="Cooling Duration (min)" name="coolingDuration" type="number" value={formData.processParameters.coolingDuration} onChange={handleProcessParamChange} /></div></div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'Finished Product' && (
                    <Card title={t('Packaged Items')} icon={<BottleIcon className="w-5 h-5"/>}>
                        <p className="text-sm text-gray-500 mb-2">{t('Define the final products for this recipe, including markup and packaging split.')}</p>
                        {totalPackagingSplit !== 100 && <p className="text-sm text-yellow-600 bg-yellow-100 p-2 rounded-md mb-4">{t('Total Packaging Split must be 100%')}. Current: {totalPackagingSplit}%</p>}
                        <div className="space-y-3">
                            {formData.packagedItems.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-color-background p-2 rounded-md">
                                    <div className="col-span-12 sm:col-span-8">
                                        <Select label={t('Item')} value={item.masterItemId} onChange={(e) => handleUpdateList('packagedItems', formData.packagedItems.map((p, i) => i === index ? { ...p, masterItemId: e.target.value } : p))} >
                                            <option value="">{t('Select Item...')}</option>
                                            {finishedGoodsMasterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                                        </Select>
                                    </div>
                                    <div className="col-span-8 sm:col-span-3">
                                        <Input label={t('Packaging Split')} type="number" value={item.packagingSplit || ''} onChange={e => handleUpdateList('packagedItems', formData.packagedItems.map((p, i) => i === index ? { ...p, packagingSplit: parseFloat(e.target.value) || 0 } : p))} unit="%" />
                                    </div>
                                    <div className="col-span-4 sm:col-span-1 flex justify-end">
                                        <button type="button" onClick={() => handleUpdateList('packagedItems', formData.packagedItems.filter(p => p.id !== item.id))} className="p-2 text-red-500 hover:text-red-400">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => handleUpdateList('packagedItems', [...formData.packagedItems, { id: generateId(), masterItemId: '' }])} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                            <PlusCircleIcon className="w-5 h-5"/><span>{t('Add Packaged Item')}</span>
                        </button>
                    </Card>
                )}
                
                {activeTab === 'Costs' && (
                     <div className="space-y-6">
                        <Card title={t('Raw Material Costs')}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b-2 border-color-border/50"><tr><th className="p-2">{t('Ingredient Name')}</th><th className="p-2">{t('Stage')}</th><th className="p-2 text-right">{t('Quantity')}</th><th className="p-2 text-right">{t('Cost per Unit')}</th><th className="p-2 text-right">{t('Total Cost')}</th></tr></thead>
                                    <tbody className="divide-y divide-color-border/20">
                                        {allIngredientsForCosting.map(ing => { const item = masterItems.find(mi => mi.id === ing.masterItemId); const cost = item?.purchaseCost || 0; const total = ing.quantity * cost; return (<tr key={ing.id}><td className="p-2 font-semibold">{item?.name || '...'}</td><td className="p-2 text-gray-500">{t(ing.stage)}</td><td className="p-2 text-right font-mono">{ing.quantity.toFixed(2)} {item?.unit}</td><td className="p-2 text-right font-mono">{cost.toFixed(2)} €</td><td className="p-2 text-right font-mono font-bold">{total.toFixed(2)} €</td></tr>)})}
                                    </tbody>
                                    <tfoot><tr className="border-t-2 border-color-border/50"><td colSpan={4} className="p-2 text-right font-bold text-color-secondary">{t('Subtotal Raw Materials')}</td><td className="p-2 text-right font-mono font-bold text-lg text-color-secondary">{rawMaterialCost.toFixed(2)} €</td></tr></tfoot>
                                </table>
                            </div>
                        </Card>

                        <Card title={t('Packaging Materials')} icon={<BottleIcon className="w-5 h-5"/>}>
                           <div className="space-y-2">
                                {formData.packagingIngredients.map((item, index) => <IngredientRow key={item.id} item={item} index={index} onUpdate={(idx, field, value) => handleUpdateList('packagingIngredients', formData.packagingIngredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))} onRemove={id => handleUpdateList('packagingIngredients', formData.packagingIngredients.filter(ing => ing.id !== id))} masterItems={masterItems} categories={categories} t={t} validCategoryNames={['Category_Packaging']} panelType="packaging" />)}
                            </div>
                            <button type="button" onClick={() => handleUpdateList('packagingIngredients', [...formData.packagingIngredients, { id: generateId(), masterItemId: '', quantity: 0 }])} className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors">
                                <PlusCircleIcon className="w-5 h-5"/><span>{t('Add Packaging Material')}</span>
                            </button>
                        </Card>

                        <Card title={t('Operational & Fixed Costs')}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Input label={t('Packaging Yield')} name="packagingYield" type="number" step="any" value={formData.processParameters.packagingYield || ''} onChange={handleProcessParamChange} unit="%" />
                                <Input label={t('Other Costs')} name="other" type="number" step="any" value={formData.additionalCosts?.other || ''} onChange={handleAdditionalCostChange} unit="€" />
                            </div>
                        </Card>

                         <Card title={t('Cost Summary')}>
                            <div className="space-y-3 p-2">
                                <div className="flex justify-between items-center text-md"><span className="font-semibold text-gray-500">{t('Subtotal Raw Materials')}</span><span className="font-mono text-lg">{rawMaterialCost.toFixed(2)} €</span></div>
                                <div className="flex justify-between items-center text-md"><span className="font-semibold text-gray-500">{t('Subtotal Packaging')}</span><span className="font-mono text-lg">{packagingCost.toFixed(2)} €</span></div>
                                <div className="flex justify-between items-center text-md"><span className="font-semibold text-gray-500">{t('Operational Costs per Batch')}</span><span className="font-mono text-lg">{operationalCostsPerBatch.toFixed(2)} €</span></div>
                                <div className="flex justify-between items-center text-md"><span className="font-semibold text-gray-500">{t('Other Costs')}</span><span className="font-mono text-lg">{otherRecipeCosts.toFixed(2)} €</span></div>
                                <div className="flex justify-between items-center text-md"><span className="font-semibold text-gray-500">{t('Calculated Excise Duty')}</span><span className="font-mono text-lg">{calculatedExciseDuty.toFixed(2)} €</span></div>
                                <hr className="my-2 border-color-border/50"/>
                                <div className="flex justify-between items-center text-xl"><span className="font-bold text-color-secondary">{t('Grand Total Batch Cost')}</span><span className="font-bold font-mono text-color-accent">{grandTotalCost.toFixed(2)} €</span></div>
                                <div className="flex justify-between items-center text-xl"><span className="font-bold text-color-secondary">{t('Cost per Liter')}</span><span className="font-bold font-mono text-color-accent">{costPerLiter.toFixed(2)} €</span></div>
                            </div>
                        </Card>
                        
                        <Card title={t('Finished Product Costing')}>
                           <div className="space-y-4">
                            {formData.packagedItems.map(packagedItem => {
                                const masterItem = masterItems.find(mi => mi.id === packagedItem.masterItemId);
                                if (!masterItem) return null;
                                const split = (packagedItem.packagingSplit || 0) / 100;
                                const totalCostForFormat = grandTotalCost * split;
                                const packagedLiters = (formData.qualityControlSpec.liters.target || 0) * ((formData.processParameters.packagingYield || 0) / 100);
                                const litersInFormat = packagedLiters * split;
                                const costPerLiterFormat = litersInFormat > 0 ? totalCostForFormat / litersInFormat : 0;
                                const costPerUnit = costPerLiterFormat * (masterItem.containerVolumeL || 0);

                                return (
                                <div key={packagedItem.id} className="bg-color-background/50 p-3 rounded-lg">
                                    <h4 className="font-bold text-color-secondary mb-2">{masterItem.name}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h5 className="font-semibold mb-1">{t('Cost Breakdown for')} {masterItem.name}</h5>
                                            <div className="space-y-1">
                                                <div className="flex justify-between"><span>{t('Raw Materials')}</span><span className="font-mono">{(rawMaterialCost * split).toFixed(2)}€</span></div>
                                                <div className="flex justify-between"><span>{t('Packaging')}</span><span className="font-mono">{(packagingCost * split).toFixed(2)}€</span></div>
                                                <div className="flex justify-between"><span>{t('Operational')}</span><span className="font-mono">{(operationalCostsPerBatch * split).toFixed(2)}€</span></div>
                                                <div className="flex justify-between"><span>{t('Calculated Excise Duty')}</span><span className="font-mono">{(calculatedExciseDuty * split).toFixed(2)}€</span></div>
                                                <div className="flex justify-between font-bold border-t border-color-border/50 pt-1 mt-1"><span>{t('Total')}</span><span className="font-mono">{(totalCostForFormat).toFixed(2)}€</span></div>
                                            </div>
                                        </div>
                                         <div>
                                            <h5 className="font-semibold mb-1">{t('Cost per Unit')}</h5>
                                             <div className="space-y-1">
                                                <div className="flex justify-between"><span>{t('Per Liter')}</span><span className="font-mono">{costPerLiterFormat.toFixed(2)} €</span></div>
                                                <div className="flex justify-between font-bold text-color-accent border-t border-color-border/50 pt-1 mt-1"><span>{t('Per Unit')} ({masterItem.containerVolumeL}L)</span><span className="font-mono">{costPerUnit.toFixed(2)} €</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                           </div>
                        </Card>
                    </div>
                )}
            </div>
        </form>
    );
};

export default RecipeFormPage;
