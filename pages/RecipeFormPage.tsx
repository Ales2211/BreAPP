
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MasterItem, Category, Ingredient, BoilWhirlpoolIngredient, MashStep, FermentationStep, TankIngredient, PackagedItemLink, QualityControlSpecification, QualityControlValueSpec, AdministrationSettings } from '../types';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, MaltIcon, HopsIcon, YeastIcon, BookOpenIcon, WrenchIcon, ThermometerIcon, DropletIcon, BottleIcon, ChevronDownIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getBlankRecipe = (): Omit<Recipe, 'id'> => ({
    name: '', style: '',
    version: '1.0',
    shelfLifeDays: 90,
    qualityControlSpec: {
        og: { target: undefined },
        fg: { target: undefined },
        abv: { target: undefined },
        ibu: { target: undefined },
        liters: { target: undefined },
        finalPh: { target: undefined },
        preFermentationPh: { target: undefined },
    },
    mashIngredients: [],
    boilWhirlpoolIngredients: [],
    tankIngredients: [],
    mashSteps: [],
    fermentationSteps: [],
    packagedItems: [],
    processParameters: {
        mashWaterMainsL: undefined, mashWaterMainsMicroSiemens: undefined,
        mashWaterRoL: undefined, mashWaterRoMicroSiemens: undefined,
        spargeWaterL: undefined, spargeWaterMicroSiemens: undefined, spargeWaterPh: undefined,
        maltMilling: undefined, expectedMashPh: undefined, expectedIodineTime: undefined,
        transferDuration: undefined, recirculationDuration: undefined, filtrationDuration: undefined,
        firstWortPlato: undefined, firstWortPh: undefined, lastWortPlato: undefined, lastWortPh: undefined,
        preBoilLiters: undefined, preBoilPlato: undefined, preBoilPh: undefined,
        postBoilLiters: undefined, postBoilPlato: undefined, postBoilPh: undefined,
        boilDuration: undefined, whirlpoolDuration: undefined, whirlpoolRestDuration: undefined, coolingDuration: undefined,
        packagingYield: 80,
    },
    additionalCosts: {
        other: undefined,
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
        // Find parent category IDs from names
        const parentCategoryIds = new Set(
            categories.filter(c => validCategoryNames.includes(c.name)).map(c => c.id)
        );

        // Find child category IDs
        const childCategoryIds = categories
            .filter(c => c.parentCategoryId && parentCategoryIds.has(c.parentCategoryId))
            .map(c => c.id);
            
        // Combine all valid IDs
        const validCategoryIds = new Set([...parentCategoryIds, ...childCategoryIds]);

        return masterItems.filter(mi => 
            validCategoryIds.has(mi.categoryId) && 
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
                panelType === 'mash' || panelType === 'packaging' ? 'col-span-12 md:col-span-7' :
                panelType === 'boil' ? 'col-span-12 md:col-span-3' :
                'col-span-12 md:col-span-7'
            }`}>
                <Input 
                    label={t('Ingredient')}
                    labelClassName="md:hidden"
                    placeholder={t('Search ingredient...')}
                    value={isFocused ? searchTerm : masterItem?.name || ''}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (item.masterItemId) onUpdate(index, 'masterItemId' as keyof T, '' as any);
                    }}
                    onFocus={() => { setSearchTerm(masterItem?.name || ''); setIsFocused(true); }}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    className={`py-1 ${isFocused ? 'rounded-b-none' : 'rounded-md'}`}
                    autoComplete="off"
                />
                {isFocused && (
                    <ul className="absolute z-10 w-full bg-color-surface border-x border-b border-color-border rounded-b-md max-h-48 overflow-y-auto shadow-lg">
                        {filteredMasterItems.length > 0 ? filteredMasterItems.map(mi => (
                            <li key={mi.id} onMouseDown={() => handleSelect(mi)} className="px-3 py-2 hover:bg-color-accent hover:text-white cursor-pointer text-sm">
                                {mi.name}
                            </li>
                        )) : (
                            <li className="px-3 py-2 text-gray-500 text-sm">{t('No ingredients found')}</li>
                        )}
                    </ul>
                )}
            </div>

            <div className="col-span-8 md:col-span-4">
                <Input 
                    label={t('Quantity')}
                    labelClassName="md:hidden"
                    type="number" step="any" min="0"
                    value={item.quantity ?? ''}
                    onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                    unit={masterItem?.unit}
                    className="py-1"
                />
                {renderItemDetails()}
            </div>

            {panelType === 'boil' && (
                <>
                    <div className="col-span-4 md:col-span-2">
                        <Select 
                            label={t('Phase')}
                            labelClassName="md:hidden"
                            value={(item as unknown as BoilWhirlpoolIngredient).type} 
                            onChange={e => onUpdate(index, 'type' as any, e.target.value)} 
                            className="py-1 h-[34px]"
                        >
                            <option value="Boil">{t('Boil')}</option>
                            <option value="Whirlpool">{t('Whirlpool')}</option>
                        </Select>
                    </div>
                    <div className="col-span-4 md:col-span-2">
                        <Input 
                            label={t('Timing')}
                            labelClassName="md:hidden"
                            type="number" 
                            value={(item as unknown as BoilWhirlpoolIngredient).timing ?? ''} 
                            onChange={e => onUpdate(index, 'timing' as any, parseInt(e.target.value, 10))} 
                            unit="min" 
                            className="py-1" 
                        />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                        {isWhirlpool && <Input 
                            label={t('Temp.')}
                            labelClassName="md:hidden"
                            type="number" 
                            value={(item as unknown as BoilWhirlpoolIngredient).temperature ?? ''} 
                            onChange={e => onUpdate(index, 'temperature' as any, parseInt(e.target.value, 10))} 
                            unit="°C" 
                            className="py-1" 
                        />}
                    </div>
                </>
            )}
            {panelType === 'tank' && (
                <div className="col-span-4 md:col-span-1">
                    <Input 
                        label={t('Day')}
                        labelClassName="md:hidden"
                        type="number" 
                        value={(item as unknown as TankIngredient).day ?? ''} 
                        onChange={e => onUpdate(index, 'day' as any, parseInt(e.target.value, 10))} 
                        className="py-1" 
                    />
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

    const handleProcessParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const type = (e.target as HTMLInputElement).type;
        if (type === 'number') {
            const parsedValue = value === '' ? undefined : parseFloat(value);
            setFormData(prev => ({ ...prev, processParameters: { ...prev.processParameters, [name]: parsedValue } }));
        } else {
            setFormData(prev => ({ ...prev, processParameters: { ...prev.processParameters, [name]: value } }));
        }
    };

    const handleAdditionalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = (value !== '') ? parseFloat(value) : undefined;
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
        otherRecipeCosts,
        operationalCostsPerBatch,
        calculatedExciseDuty, 
    } = useMemo(() => {
        const { 
            annualBatches, annualManpowerCost, annualGasCost, annualRentCost, annualWaterCost,
            annualDetergentsCost, annualCo2Cost 
        } = administrationSettings;
        const opCostsPerBatch = (annualBatches || 0) > 0 
            ? ((annualManpowerCost || 0) + 
              (annualGasCost || 0) + 
              (annualRentCost || 0) + 
              (annualWaterCost || 0) +
              (annualDetergentsCost || 0) +
              (annualCo2Cost || 0)
             ) / annualBatches! 
            : 0;

        const rmCost = [...formData.mashIngredients, ...formData.boilWhirlpoolIngredients, ...formData.tankIngredients]
            .reduce((sum, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                return sum + (ing.quantity * (item?.purchaseCost || 0));
            }, 0);
        
        const packagedLiters = (formData.qualityControlSpec.liters.target || 0) * ((formData.processParameters.packagingYield || 0) / 100);
        const exciseDuty = (formData.qualityControlSpec.og.target || 0) * (packagedLiters / 100) * (administrationSettings.exciseDutyRate || 0);
        
        const otherCosts = Object.values(formData.additionalCosts || {}).reduce((sum: number, cost) => sum + (Number(cost) || 0), 0);
        
        return {
            rawMaterialCost: rmCost,
            otherRecipeCosts: otherCosts,
            operationalCostsPerBatch: opCostsPerBatch,
            calculatedExciseDuty: exciseDuty,
        };
    }, [formData, masterItems, administrationSettings]);

    const tabs = ['General', 'Ingredients', 'Process', 'Packaging'];

    return (
        <form onSubmit={handleSave} className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
                <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border/50 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-3xl font-bold text-color-text">
                    {recipe ? t('Edit Recipe') : t('Create Recipe')}
                </h1>
            </div>
            
            <div className="mb-4">
                <nav className="flex space-x-4 bg-color-surface/50 rounded-lg p-1">
                    {tabs.map(tab => (
                        <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                                activeTab === tab ? 'bg-color-accent text-white shadow-md' : 'text-gray-600 hover:bg-color-border/50'
                            }`}
                        >
                            {t(tab)}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="space-y-6">
                {activeTab === 'General' && (
                    <Card title={t('Recipe Details')} icon={<BookOpenIcon className="w-5 h-5"/>}>
                        <div className="space-y-6">
                            {/* Section 1: Basic Info */}
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary border-b border-color-border/50 pb-2 mb-4">{t('Basic Info')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input containerClassName="md:col-span-3" label={t('Recipe Name')} name="name" value={formData.name} onChange={handleChange} required />
                                    <Input label={t('Style')} name="style" value={formData.style} onChange={handleChange} required />
                                    <Input label={t('Version')} name="version" value={formData.version || ''} onChange={handleChange} />
                                    <Input label={t('Shelf Life (days)')} name="shelfLifeDays" type="number" value={formData.shelfLifeDays ?? ''} onChange={handleChange} />
                                </div>
                            </div>

                            {/* Section 2: Quality Control Specs */}
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary border-b border-color-border/50 pb-2 mb-4">{t('Key Parameters')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <QcInput label="OG (°P)" field="og" value={formData.qualityControlSpec.og} onChange={handleQcChange} />
                                    <QcInput label="FG (°P)" field="fg" value={formData.qualityControlSpec.fg} onChange={handleQcChange} />
                                    <QcInput label="ABV (%)" field="abv" value={formData.qualityControlSpec.abv} onChange={handleQcChange} />
                                    <QcInput label="IBU" field="ibu" value={formData.qualityControlSpec.ibu} onChange={handleQcChange} />
                                    <QcInput label="Final Volume (L)" field="liters" value={formData.qualityControlSpec.liters} onChange={handleQcChange} />
                                    <QcInput label="Final pH" field="finalPh" value={formData.qualityControlSpec.finalPh} onChange={handleQcChange} />
                                    <QcInput label="Pre-Ferm pH" field="preFermentationPh" value={formData.qualityControlSpec.preFermentationPh} onChange={handleQcChange} />
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
                
                 {activeTab === 'Ingredients' && (
                    <div className="space-y-6">
                        <IngredientSection 
                            title="Mash Ingredients" 
                            icon={<MaltIcon className="w-5 h-5"/>} 
                            items={formData.mashIngredients} 
                            onUpdate={(newList) => handleUpdateList('mashIngredients', newList)}
                            panelType="mash"
                            masterItems={masterItems} categories={categories} t={t}
                            validCategoryNames={['Malt', 'Sugar', 'Adjunct']}
                            totalWeightForPercentage={totalGristWeight}
                            categoryForPercentage="Malt"
                        />
                        <IngredientSection 
                            title="Boil & Whirlpool" 
                            icon={<HopsIcon className="w-5 h-5"/>} 
                            items={formData.boilWhirlpoolIngredients} 
                            onUpdate={(newList) => handleUpdateList('boilWhirlpoolIngredients', newList)}
                            panelType="boil"
                            masterItems={masterItems} categories={categories} t={t}
                            validCategoryNames={['Hops', 'Spices', 'Sugar', 'Adjunct', 'Other']}
                            litersForGl={formData.processParameters.postBoilLiters}
                        />
                        <IngredientSection 
                            title="Tank Ingredients" 
                            icon={<YeastIcon className="w-5 h-5"/>} 
                            items={formData.tankIngredients} 
                            onUpdate={(newList) => handleUpdateList('tankIngredients', newList)}
                            panelType="tank"
                            masterItems={masterItems} categories={categories} t={t}
                            validCategoryNames={['Hops', 'Yeast', 'Spices', 'Sugar', 'Adjunct', 'Other']}
                            litersForGl={formData.qualityControlSpec.liters.target}
                        />
                    </div>
                 )}
                 
                 {activeTab === 'Process' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title={t('Mash')} icon={<ThermometerIcon className="w-5 h-5"/>}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input label={t('Mash Water (Mains, L)')} name="mashWaterMainsL" type="number" step="any" value={formData.processParameters.mashWaterMainsL ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Mash Water (Mains, µS/cm)')} name="mashWaterMainsMicroSiemens" type="number" step="any" value={formData.processParameters.mashWaterMainsMicroSiemens ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Mash Water (RO, L)')} name="mashWaterRoL" type="number" step="any" value={formData.processParameters.mashWaterRoL ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Mash Water (RO, µS/cm)')} name="mashWaterRoMicroSiemens" type="number" step="any" value={formData.processParameters.mashWaterRoMicroSiemens ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Malt Milling (%)')} name="maltMilling" type="number" step="any" value={formData.processParameters.maltMilling ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Expected Mash pH')} name="expectedMashPh" type="number" step="0.01" value={formData.processParameters.expectedMashPh ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Expected Iodine Time (min)')} name="expectedIodineTime" type="number" value={formData.processParameters.expectedIodineTime ?? ''} onChange={handleProcessParamChange} />
                           </div>
                           <h4 className="font-semibold text-color-secondary mt-6 mb-2">{t('Mash Steps')}</h4>
                           <StepManager type="mash" steps={formData.mashSteps} onUpdate={(newSteps) => handleUpdateList('mashSteps', newSteps)} t={t} />
                        </Card>
                         <Card title={t('Lauter')} icon={<DropletIcon className="w-5 h-5"/>}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input label={t('Transfer Duration (min)')} name="transferDuration" type="number" value={formData.processParameters.transferDuration ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Recirculation Duration (min)')} name="recirculationDuration" type="number" value={formData.processParameters.recirculationDuration ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Filtration Duration (min)')} name="filtrationDuration" type="number" value={formData.processParameters.filtrationDuration ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('First Wort (°P)')} name="firstWortPlato" type="number" step="0.1" value={formData.processParameters.firstWortPlato ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('First Wort pH')} name="firstWortPh" type="number" step="0.01" value={formData.processParameters.firstWortPh ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Last Wort (°P)')} name="lastWortPlato" type="number" step="0.1" value={formData.processParameters.lastWortPlato ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Last Wort pH')} name="lastWortPh" type="number" step="0.01" value={formData.processParameters.lastWortPh ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Sparge Water (L)')} name="spargeWaterL" type="number" step="any" value={formData.processParameters.spargeWaterL ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Sparge Water (µS/cm)')} name="spargeWaterMicroSiemens" type="number" step="any" value={formData.processParameters.spargeWaterMicroSiemens ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Sparge Water pH')} name="spargeWaterPh" type="number" step="0.01" value={formData.processParameters.spargeWaterPh ?? ''} onChange={handleProcessParamChange} />
                           </div>
                        </Card>
                        <Card title={t('Boil & Cooling')} icon={<ThermometerIcon className="w-5 h-5"/>}>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input label={t('Pre-Boil Liters')} name="preBoilLiters" type="number" step="any" value={formData.processParameters.preBoilLiters ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Pre-Boil Plato (°P)')} name="preBoilPlato" type="number" step="0.1" value={formData.processParameters.preBoilPlato ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Pre-boil pH')} name="preBoilPh" type="number" step="0.01" value={formData.processParameters.preBoilPh ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Post-Boil Liters')} name="postBoilLiters" type="number" step="any" value={formData.processParameters.postBoilLiters ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Post-Boil Plato (°P)')} name="postBoilPlato" type="number" step="0.1" value={formData.processParameters.postBoilPlato ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Post-Boil pH')} name="postBoilPh" type="number" step="0.01" value={formData.processParameters.postBoilPh ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Boil Duration (min)')} name="boilDuration" type="number" value={formData.processParameters.boilDuration ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Whirlpool Duration (min)')} name="whirlpoolDuration" type="number" value={formData.processParameters.whirlpoolDuration ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Whirlpool Rest (min)')} name="whirlpoolRestDuration" type="number" value={formData.processParameters.whirlpoolRestDuration ?? ''} onChange={handleProcessParamChange} />
                               <Input label={t('Cooling Duration (min)')} name="coolingDuration" type="number" value={formData.processParameters.coolingDuration ?? ''} onChange={handleProcessParamChange} />
                               <div className="md:col-span-2 border-t border-color-border/30 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input 
                                        label={t('Boil Water Addition')} 
                                        name="boilWaterAdditionL" 
                                        type="number" 
                                        step="any" 
                                        value={formData.processParameters.boilWaterAdditionL ?? ''} 
                                        onChange={handleProcessParamChange}
                                        unit="L"
                                    />
                                    <Input 
                                        label={t('Notes')} 
                                        name="boilWaterAdditionNotes" 
                                        value={formData.processParameters.boilWaterAdditionNotes || ''} 
                                        onChange={handleProcessParamChange}
                                    />
                                </div>
                           </div>
                        </Card>
                        <Card title={t('Fermentation')} icon={<YeastIcon className="w-5 h-5"/>}>
                           <h4 className="font-semibold text-color-secondary mb-2">{t('Fermentation Steps')}</h4>
                           <StepManager type="ferm" steps={formData.fermentationSteps} onUpdate={(newSteps) => handleUpdateList('fermentationSteps', newSteps)} t={t} />
                        </Card>
                     </div>
                 )}
                 
                {activeTab === 'Packaging' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title={t('Packaging Yield & Costs')} icon={<BottleIcon className="w-5 h-5"/>}>
                             <Input 
                                label={t('Packaging Yield (%)')} 
                                name="packagingYield" 
                                type="number"
                                step="1"
                                min="0" max="100"
                                value={formData.processParameters.packagingYield ?? ''} 
                                onChange={handleProcessParamChange} 
                                unit="%"
                            />
                             <Input 
                                label={t('Other Costs per Batch')} 
                                name="other" 
                                type="number"
                                step="0.01"
                                containerClassName="mt-4"
                                value={formData.additionalCosts.other ?? ''} 
                                onChange={handleAdditionalCostChange} 
                                unit="€"
                            />
                            <div className="mt-6 bg-color-background p-4 rounded-lg space-y-2 text-sm">
                                <CostRow label={t('Raw Material Cost')} value={rawMaterialCost} />
                                <CostRow label={t('Operational Costs per Batch')} value={operationalCostsPerBatch} />
                                <CostRow label={t('Excise Duty per Batch')} value={calculatedExciseDuty} />
                                <CostRow label={t('Other Costs')} value={otherRecipeCosts} />
                            </div>
                        </Card>
                        <Card title={t('Packaged Items')} icon={<BottleIcon className="w-5 h-5"/>}>
                            <PackagingManager
                                items={formData.packagedItems}
                                onUpdate={(newList) => handleUpdateList('packagedItems', newList)}
                                masterItems={finishedGoodsMasterItems}
                                categories={categories}
                                t={t}
                            />
                        </Card>
                    </div>
                )}
            </div>
            
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

// Sub-components

const QcInput: React.FC<{
    label: string,
    field: keyof QualityControlSpecification,
    value: QualityControlValueSpec,
    onChange: (field: keyof QualityControlSpecification, subfield: keyof QualityControlValueSpec, value: string) => void,
}> = ({ label, field, value, onChange }) => {
    const { t } = useTranslation();

    const tolerance = useMemo(() => {
        if (value && value.target !== undefined && value.max !== undefined && value.min !== undefined) {
            const tol1 = value.max - value.target;
            const tol2 = value.target - value.min;
            if (tol1 >= 0 && tol2 >= 0 && Math.abs(tol1 - tol2) < 0.001) { // Check for symmetry
                return parseFloat(tol1.toPrecision(15));
            }
        }
        return undefined;
    }, [value]);

    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTargetStr = e.target.value;
        onChange(field, 'target', newTargetStr);

        const newTarget = newTargetStr === '' ? undefined : parseFloat(newTargetStr);
        if (newTarget !== undefined && tolerance !== undefined) {
            const newMin = newTarget - tolerance;
            const newMax = newTarget + tolerance;
            onChange(field, 'min', String(newMin));
            onChange(field, 'max', String(newMax));
        }
    };
    
    const handleToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newToleranceStr = e.target.value;
        const newTolerance = newToleranceStr === '' ? undefined : parseFloat(newToleranceStr);
        
        const target = value?.target;

        if (target !== undefined && newTolerance !== undefined && newTolerance >= 0) {
            const newMin = target - newTolerance;
            const newMax = target + newTolerance;
            onChange(field, 'min', String(newMin));
            onChange(field, 'max', String(newMax));
        } else {
            onChange(field, 'min', '');
            onChange(field, 'max', '');
        }
    };
    
    return (
    <div>
        <label className="mb-1 block text-sm font-medium text-gray-500">{label}</label>
        <div className="flex items-center space-x-2">
            <Input 
                type="number" 
                step="any" 
                placeholder={t('Target')} 
                value={value?.target ?? ''} 
                onChange={handleTargetChange}
                className="w-full text-center !p-2 text-lg font-bold"
                aria-label={`${label} Target`}
                containerClassName="flex-grow"
            />
            <div className="relative flex-shrink-0 w-28">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">±</span>
                <Input 
                    type="number" 
                    step="any" 
                    placeholder={t('Tolerance')}
                    value={tolerance ?? ''} 
                    onChange={handleToleranceChange}
                    className="w-full text-center !p-2 !pl-8"
                    aria-label={`${label} Tolerance`}
                />
            </div>
        </div>
    </div>
)};

const IngredientSection = <T extends Ingredient>({ title, icon, items, onUpdate, ...rest }: { title: string, icon: React.ReactNode } & IngredientPanelProps<T>) => {
    const handleUpdateItem = (index: number, field: keyof T, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate(newItems);
    };

    const handleAddItem = () => {
        const newItem: T = { id: generateId(), masterItemId: '', quantity: 0 } as T;
        onUpdate([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        onUpdate(items.filter(item => item.id !== id));
    };

    return (
        <Card title={rest.t(title)} icon={icon}>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <IngredientRow
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={handleUpdateItem}
                        onRemove={handleRemoveItem}
                        {...rest}
                    />
                ))}
            </div>
             <button type="button" onClick={handleAddItem} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                <PlusCircleIcon className="w-5 h-5"/>
                <span>{rest.t('Add Ingredient')}</span>
            </button>
        </Card>
    );
};

type Step = MashStep | FermentationStep;
const StepManager: React.FC<{
    type: 'mash' | 'ferm';
    steps: Step[];
    onUpdate: (steps: Step[]) => void;
    t: (key: string) => string;
}> = ({ type, steps, onUpdate, t }) => {
    // FIX: Widened the type of 'field' to allow updating properties specific to either MashStep or FermentationStep.
    // The original `keyof Step` resolves to only common properties, causing type errors.
    const handleUpdateStep = (index: number, field: keyof MashStep | keyof FermentationStep, value: any) => {
        const newSteps = [...steps];
        const parsedValue = (typeof (newSteps[index] as any)[field] === 'number') ? (value === '' ? undefined : parseFloat(value)) : value;
        newSteps[index] = { ...newSteps[index], [field]: parsedValue };
        onUpdate(newSteps);
    };

    const handleAddStep = () => {
        const newStep = type === 'mash' 
            ? { id: generateId(), type: 'Infusion', temperature: 65, duration: 60 }
            : { id: generateId(), description: '', temperature: 19, pressure: 0.8, days: 7 };
        onUpdate([...steps, newStep as Step]);
    };

    const handleRemoveStep = (id: string) => {
        onUpdate(steps.filter(step => step.id !== id));
    };

    return (
        <div className="space-y-2">
            {steps.map((step, index) => (
                <div key={step.id} className="grid grid-cols-12 gap-2 items-end bg-color-background/50 p-2 rounded-md">
                    {type === 'mash' ? (
                        <>
                            <div className="col-span-12 md:col-span-3"> <Select label={t('Type')} value={(step as MashStep).type} onChange={e => handleUpdateStep(index, 'type', e.target.value)} className="py-1"> <option value="Infusion">{t('Infusion')}</option> <option value="Decoction">{t('Decoction')}</option> <option value="Temperature">{t('Temperature')}</option> </Select> </div>
                            <div className="col-span-6 md:col-span-4"> <Input label={t('Temperature')} type="number" value={(step as MashStep).temperature ?? ''} onChange={e => handleUpdateStep(index, 'temperature', e.target.value)} unit="°C" className="py-1" /> </div>
                            <div className="col-span-6 md:col-span-4"> <Input label={t('Duration')} type="number" value={(step as MashStep).duration ?? ''} onChange={e => handleUpdateStep(index, 'duration', e.target.value)} unit="min" className="py-1" /> </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-12 md:col-span-3"> <Input label={t('Description')} value={(step as FermentationStep).description} onChange={e => handleUpdateStep(index, 'description', e.target.value)} className="py-1" /> </div>
                            <div className="col-span-4 md:col-span-2"> <Input label={t('Temperature')} type="number" value={(step as FermentationStep).temperature ?? ''} onChange={e => handleUpdateStep(index, 'temperature', e.target.value)} unit="°C" className="py-1" /> </div>
                            <div className="col-span-4 md:col-span-2"> <Input label={t('Pressure')} type="number" step="0.1" value={(step as FermentationStep).pressure ?? ''} onChange={e => handleUpdateStep(index, 'pressure', e.target.value)} unit="Bar" className="py-1" /> </div>
                            <div className="col-span-4 md:col-span-2"> <Input label={t('Days')} type="number" value={(step as FermentationStep).days ?? ''} onChange={e => handleUpdateStep(index, 'days', e.target.value)} className="py-1" /> </div>
                        </>
                    )}
                     <div className="col-span-12 md:col-span-1 flex items-center justify-end"> <button type="button" onClick={() => handleRemoveStep(step.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"> <TrashIcon className="w-5 h-5"/> </button> </div>
                </div>
            ))}
             <button type="button" onClick={handleAddStep} className="mt-2 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors"> <PlusCircleIcon className="w-5 h-5"/> <span>{t('Add Step')}</span> </button>
        </div>
    );
};


const PackagingManager: React.FC<{
    items: PackagedItemLink[];
    onUpdate: (items: PackagedItemLink[]) => void;
    masterItems: MasterItem[];
    categories: Category[];
    t: (key: string) => string;
}> = ({ items, onUpdate, masterItems, categories, t }) => {
    const totalSplit = useMemo(() => items.reduce((sum, item) => sum + (item.packagingSplit || 0), 0), [items]);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    const handleUpdateItem = (index: number, field: keyof PackagedItemLink | 'packagingIngredients', value: any) => {
        const newItems = [...items];
        if (field === 'packagingIngredients') {
            newItems[index].packagingIngredients = value as Ingredient[];
        } else {
            const parsedValue = (field === 'packagingSplit') ? (value === '' ? undefined : parseFloat(value)) : value;
            (newItems[index] as any)[field] = parsedValue;
        }
        onUpdate(newItems);
    };

    const handleAddItem = () => {
        if (masterItems.length === 0) return;
        const newItem: PackagedItemLink = { id: generateId(), masterItemId: masterItems[0].id, packagingSplit: 0, packagingIngredients: [] };
        onUpdate([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        onUpdate(items.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={item.id} className="bg-color-background/50 p-2 rounded-md">
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-7">
                            <Select label={t('Finished Good')} value={item.masterItemId} onChange={e => handleUpdateItem(index, 'masterItemId', e.target.value)} className="py-1">
                                {masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                            </Select>
                        </div>
                        <div className="col-span-3">
                            <Input label={t('Split')} type="number" min="0" max="100" value={item.packagingSplit ?? ''} onChange={e => handleUpdateItem(index, 'packagingSplit', e.target.value)} unit="%" className="py-1"/>
                        </div>
                        <div className="col-span-2 flex justify-end items-center space-x-1">
                             <button type="button" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)} className="p-2 text-gray-400 hover:text-color-secondary rounded-full hover:bg-color-secondary/10 transition-colors">
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItemId === item.id ? 'rotate-180' : ''}`}/>
                             </button>
                             <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors">
                                <TrashIcon className="w-5 h-5"/>
                             </button>
                        </div>
                    </div>
                    {expandedItemId === item.id && (
                        <div className="mt-2 p-2 border-t border-color-border/30">
                            <IngredientSection
                                title="Packaging Ingredients"
                                icon={<WrenchIcon className="w-5 h-5"/>}
                                items={item.packagingIngredients}
                                onUpdate={(newList) => handleUpdateItem(index, 'packagingIngredients', newList)}
                                panelType="packaging"
                                masterItems={masterItems}
                                categories={categories}
                                t={t}
                                validCategoryNames={['Packaging Materials']}
                            />
                        </div>
                    )}
                </div>
            ))}
            <div className={`mt-2 text-right font-bold ${totalSplit !== 100 ? 'text-red-500' : 'text-green-500'}`}>
                {t('Total Split')}: {totalSplit}%
            </div>
             <button type="button" onClick={handleAddItem} className="mt-2 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors"> <PlusCircleIcon className="w-5 h-5"/> <span>{t('Add Packaging Item')}</span> </button>
        </div>
    );
};

const CostRow: React.FC<{ label: string; value: number; isBold?: boolean; color?: string }> = ({ label, value, isBold, color = 'text-color-text' }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-500">{label}</span>
        <span className={`${isBold ? 'font-bold' : ''} ${color} font-mono`}>{value.toFixed(2)} €</span>
    </div>
);


export default RecipeFormPage;
