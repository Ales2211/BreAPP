import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MasterItem, Category, Ingredient, BoilWhirlpoolIngredient, MashStep, FermentationStep, TankIngredient, PackagedItemLink, QualityControlSpecification, QualityControlValueSpec } from '../types';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, MaltIcon, HopsIcon, YeastIcon, BookOpenIcon, WrenchIcon, ThermometerIcon } from '../components/Icons';
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
    },
    notes: ''
});

// A more flexible ingredient panel
interface IngredientPanelProps<T extends Ingredient> {
    title: string;
    items: T[];
    masterItems: MasterItem[];
    categories: Category[];
    onUpdate: (items: T[]) => void;
    t: (key: string) => string;
    icon: React.ReactNode;
    addButtonLabel: string;
    validCategoryNames: string[];
    panelType: 'mash' | 'boil' | 'tank';
    // Props for calculations
    totalWeightForPercentage?: number;
    categoryForPercentage?: string;
    litersForGl?: number;
}

const IngredientPanel = <T extends Ingredient>({ 
    title, items, masterItems, categories, onUpdate, t, icon, addButtonLabel, validCategoryNames, panelType,
    totalWeightForPercentage, categoryForPercentage, litersForGl
}: IngredientPanelProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeInput, setActiveInput] = useState<number | null>(null);
    
    const categoryIdForPercentage = useMemo(() => categories.find(c => c.name === categoryForPercentage)?.id, [categories, categoryForPercentage]);
    const hopsCategoryId = useMemo(() => categories.find(c => c.name === 'Hops')?.id, [categories]);

    const filteredMasterItems = useMemo(() => {
        const validCategoryIds = categories.filter(c => validCategoryNames.includes(c.name)).map(c => c.id);
        return masterItems.filter(mi => 
            validCategoryIds.includes(mi.categoryId) && 
            mi.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, masterItems, categories, validCategoryNames]);

    const handleUpdate = (index: number, field: keyof T, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onUpdate(newItems);
    };

    const handleSelect = (index: number, mi: MasterItem) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], masterItemId: mi.id };
        onUpdate(newItems);
        setActiveInput(null);
    };

    const addItem = () => {
        const baseItem = { id: generateId(), masterItemId: '', quantity: 0 };
        let newItem: T;

        switch(panelType) {
            case 'boil':
                newItem = { ...baseItem, type: 'Boil', timing: 60 } as unknown as T;
                break;
            case 'tank':
                newItem = { ...baseItem, day: 0 } as unknown as T;
                break;
            case 'mash':
            default:
                newItem = baseItem as T;
                break;
        }
        onUpdate([...items, newItem]);
    };

    const removeItem = (id: string) => {
        onUpdate(items.filter(item => item.id !== id));
    };
    
    const getSackInfo = (item: T) => {
        const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
        if (!masterItem || !masterItem.format || masterItem.format <= 0) return null;
        const sackCount = (item.quantity / masterItem.format).toFixed(1);
        return `(${masterItem.format} ${masterItem.unit}) - (${sackCount} ${t('sacks')})`;
    };

    const getCalculationInfo = (item: T) => {
        const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
        if (!masterItem) return null;
        
        const calcs = [];

        // Percentage calculation
        if (categoryIdForPercentage && masterItem.categoryId === categoryIdForPercentage && totalWeightForPercentage && totalWeightForPercentage > 0) {
            const percentage = (item.quantity / totalWeightForPercentage * 100).toFixed(1);
            calcs.push(`${percentage}%`);
        }

        // g/L calculation
        if (masterItem.categoryId === hopsCategoryId && litersForGl && litersForGl > 0) {
            const gl = (item.quantity / litersForGl).toFixed(2);
            calcs.push(`${gl} g/L`);
        }

        return calcs.length > 0 ? calcs.join(' | ') : null;
    };

    const renderItemDetails = (item: T) => {
        const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
        if (!masterItem) return null;
        
        const sackInfo = getSackInfo(item);
        const calcInfo = getCalculationInfo(item);
        
        const allDetails = [sackInfo, calcInfo].filter(Boolean);

        if (allDetails.length === 0) return null;

        return (
            <p className="text-xs text-gray-500 -mt-1">
                {allDetails.join(' | ')}
            </p>
        );
    };

    return (
        <Card title={title} icon={icon}>
            <div className="space-y-3">
                {items.map((item, index) => {
                    const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                    // FIX: Cast to unknown first to allow conversion from generic T to specific ingredient type.
                    const isWhirlpool = panelType === 'boil' && (item as unknown as BoilWhirlpoolIngredient).type === 'Whirlpool';
                    return (
                        <div key={item.id} className="bg-color-background p-3 rounded-lg space-y-2">
                             <div className="relative">
                                <Input 
                                    label={t('Ingredient')}
                                    placeholder={t('Search ingredient...')}
                                    value={activeInput === index ? searchTerm : masterItem?.name || ''}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        // Clear masterItemId when user types
                                        if (item.masterItemId) {
                                            handleUpdate(index, 'masterItemId', '' as any);
                                        }
                                    }}
                                    onFocus={() => { 
                                        setSearchTerm(masterItem?.name || ''); 
                                        setActiveInput(index); 
                                    }}
                                    onBlur={() => setTimeout(() => setActiveInput(null), 150)} // Delay to allow click on dropdown
                                />
                                {activeInput === index && (
                                    <ul className="absolute z-10 w-full bg-color-surface border border-color-border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                        {filteredMasterItems.map(mi => (
                                            <li key={mi.id} onMouseDown={() => handleSelect(index, mi)} className="px-3 py-2 hover:bg-color-accent hover:text-white cursor-pointer">
                                                {mi.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            {renderItemDetails(item)}

                            <div className={`grid ${panelType === 'boil' ? (isWhirlpool ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-3 md:grid-cols-5') : 'grid-cols-2 md:grid-cols-4'} gap-2 items-end`}>
                                <Input 
                                    label={t('Quantity')}
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    unit={masterItem?.unit}
                                />
                                {panelType === 'boil' && (
                                     <>
                                        <Input
                                            label={t('Timing')}
                                            type="number"
                                            // FIX: Cast to unknown first to allow conversion from generic T to specific ingredient type.
                                            value={(item as unknown as BoilWhirlpoolIngredient).timing}
                                            onChange={e => handleUpdate(index, 'timing' as any, parseInt(e.target.value, 10))}
                                            unit="min"
                                        />
                                        <select
                                            // FIX: Cast to unknown first to allow conversion from generic T to specific ingredient type.
                                            value={(item as unknown as BoilWhirlpoolIngredient).type}
                                            onChange={e => handleUpdate(index, 'type' as any, e.target.value)}
                                            className="self-end w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:ring-2 focus:ring-color-accent transition-colors"
                                        >
                                            <option value="Boil">{t('Boil')}</option>
                                            <option value="Whirlpool">{t('Whirlpool')}</option>
                                        </select>
                                        {isWhirlpool && (
                                            <Input
                                                label={t('Temp.')}
                                                type="number"
                                                // FIX: Cast to unknown first to allow conversion from generic T to specific ingredient type.
                                                value={(item as unknown as BoilWhirlpoolIngredient).temperature || ''}
                                                onChange={e => handleUpdate(index, 'temperature' as any, parseInt(e.target.value, 10))}
                                                unit="°C"
                                            />
                                        )}
                                    </>
                                )}
                                {panelType === 'tank' && (
                                    <Input
                                        label={t('Day')}
                                        type="number"
                                        // FIX: Cast to unknown first to allow conversion from generic T to specific ingredient type.
                                        value={(item as unknown as TankIngredient).day}
                                        onChange={e => handleUpdate(index, 'day' as any, parseInt(e.target.value, 10))}
                                    />
                                )}
                                <div className="col-start-[-2]">
                                    <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:text-red-400">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={addItem} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                <PlusCircleIcon className="w-5 h-5"/>
                <span>{addButtonLabel}</span>
            </button>
        </Card>
    );
};


interface RecipeFormPageProps {
  recipe: Recipe | null;
  masterItems: MasterItem[];
  categories: Category[];
  onSave: (recipe: Recipe) => void;
  onBack: () => void;
}

const RecipeFormPage: React.FC<RecipeFormPageProps> = ({ recipe, masterItems, categories, onSave, onBack }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Recipe | Omit<Recipe, 'id'>>(() => recipe || getBlankRecipe());

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

    const handleUpdateList = <T,>(key: keyof Recipe, newList: T[]) => {
        setFormData(prev => ({...prev, [key]: newList} as unknown as Recipe | Omit<Recipe, 'id'>));
    };

    const handleQcChange = (field: keyof QualityControlSpecification, subfield: keyof QualityControlValueSpec, value: string) => {
        const parsedValue = value === '' ? undefined : parseFloat(value);
        setFormData(prev => {
            const spec = (prev.qualityControlSpec || {}) as QualityControlSpecification;
            const fieldSpec = (spec[field] || {}) as QualityControlValueSpec;
            
            return {
                ...prev,
                qualityControlSpec: {
                    ...spec,
                    [field]: {
                        ...fieldSpec,
                        [subfield]: parsedValue,
                    }
                }
            };
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Recipe);
    };
    
    // Derived values for calculations
    const totalGristWeight = useMemo(() => {
        return formData.mashIngredients.reduce((sum, ing) => sum + ing.quantity, 0);
    }, [formData.mashIngredients]);

    const { recipeCost, costPerLiter } = useMemo(() => {
        const totalCost = [...formData.mashIngredients, ...formData.boilWhirlpoolIngredients, ...formData.tankIngredients]
            .reduce((acc, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                const cost = item?.purchaseCost || 0;
                return acc + (ing.quantity * cost);
            }, 0);

        const targetLiters = formData.qualityControlSpec?.liters?.target || 0;
        const cpl = targetLiters > 0 ? totalCost / targetLiters : 0;
        return { recipeCost: totalCost, costPerLiter: cpl };
    }, [formData, masterItems]);

    return (
        <form onSubmit={handleSave} className="max-w-7xl mx-auto">
             <div className="flex items-center mb-6">
                <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border/50 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-3xl font-bold text-color-text">
                    {recipe ? t('Edit Recipe') : t('Create Recipe')}
                </h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title={t('General Information')} icon={<BookOpenIcon className="w-5 h-5"/>}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input containerClassName="md:col-span-2" label={t('Recipe Name')} name="name" value={formData.name} onChange={handleChange} required />
                            <Input label={t('Style')} name="style" value={formData.style} onChange={handleChange} />
                             <Input label={t('Shelf Life (days)')} name="shelfLifeDays" type="number" value={formData.shelfLifeDays || ''} onChange={handleChange} />
                        </div>
                    </Card>
                    <Card title={t('Targets')} icon={<ThermometerIcon className="w-5 h-5"/>}>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 items-end">
                            {/* Header row */}
                            <div className="hidden md:block font-semibold text-gray-500 text-sm"></div>
                            <div className="hidden md:block font-semibold text-gray-500 text-sm text-center">{t('Target')}</div>
                            <div className="hidden md:block font-semibold text-gray-500 text-sm text-center">Min / Max</div>
                            
                            {[
                                { key: 'og', label: 'OG (°P)', step: 0.1 },
                                { key: 'fg', label: 'FG (°P)', step: 0.1 },
                                { key: 'abv', label: 'ABV (%)', step: 0.1 },
                                { key: 'ibu', label: 'IBU', step: 1 },
                                { key: 'liters', label: 'Liters (L)', step: 1 },
                                { key: 'preFermentationPh', label: 'Pre-fermentation pH', step: 0.01 },
                                { key: 'finalPh', label: 'Final pH', step: 0.01 },
                            ].map(({key, label, step}) => (
                                <React.Fragment key={key}>
                                    <label className="font-medium self-center text-sm md:text-base mt-2 md:mt-0">{t(label)}</label>
                                    <Input 
                                        type="number" 
                                        step={step} 
                                        value={formData.qualityControlSpec?.[key as keyof QualityControlSpecification]?.target || ''} 
                                        onChange={e => handleQcChange(key as keyof QualityControlSpecification, 'target', e.target.value)} 
                                        aria-label={`${t(label)} ${t('Target')}`}
                                    />
                                    <div className="flex gap-2">
                                        <Input 
                                            type="number" 
                                            step={step} 
                                            value={formData.qualityControlSpec?.[key as keyof QualityControlSpecification]?.min ?? ''} 
                                            placeholder={t('Min')} 
                                            onChange={e => handleQcChange(key as keyof QualityControlSpecification, 'min', e.target.value)} 
                                            aria-label={`${t(label)} ${t('Min')}`}
                                        />
                                        <Input 
                                            type="number" 
                                            step={step} 
                                            value={formData.qualityControlSpec?.[key as keyof QualityControlSpecification]?.max ?? ''} 
                                            placeholder={t('Max')} 
                                            onChange={e => handleQcChange(key as keyof QualityControlSpecification, 'max', e.target.value)} 
                                            aria-label={`${t(label)} ${t('Max')}`}
                                        />
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    <IngredientPanel 
                        title={t('Mash Ingredients')}
                        items={formData.mashIngredients}
                        masterItems={masterItems}
                        categories={categories}
                        onUpdate={(newList) => handleUpdateList('mashIngredients', newList)}
                        t={t}
                        icon={<MaltIcon className="w-5 h-5" />}
                        addButtonLabel={t('Add Mash Ingredient')}
                        validCategoryNames={['Malt', 'Adjunct', 'Sugar', 'Category_Other']}
                        panelType="mash"
                        totalWeightForPercentage={totalGristWeight}
                        categoryForPercentage="Malt"
                    />

                    <IngredientPanel
                        title={t('Boil & Whirlpool')}
                        items={formData.boilWhirlpoolIngredients}
                        masterItems={masterItems}
                        categories={categories}
                        onUpdate={(newList) => handleUpdateList('boilWhirlpoolIngredients', newList)}
                        t={t}
                        icon={<HopsIcon className="w-5 h-5" />}
                        addButtonLabel={t('Add Boil/Whirlpool Ingredient')}
                        validCategoryNames={['Hops', 'Spices', 'Sugar', 'Category_Other']}
                        panelType="boil"
                        litersForGl={formData.qualityControlSpec.liters.target}
                    />
                    
                    <IngredientPanel
                        title={t('Tank Ingredients')}
                        items={formData.tankIngredients}
                        masterItems={masterItems}
                        categories={categories}
                        onUpdate={(newList) => handleUpdateList('tankIngredients', newList)}
                        t={t}
                        icon={<YeastIcon className="w-5 h-5" />}
                        addButtonLabel={t('Add Tank Ingredient')}
                        validCategoryNames={['Yeast', 'Hops', 'Spices', 'Adjunct', 'Category_Other']}
                        panelType="tank"
                        litersForGl={formData.qualityControlSpec.liters.target}
                    />

                </div>
                 {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title={t('Cost Analysis')}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold text-gray-500">{t('Total Batch Cost')}</span>
                                <span className="font-bold text-color-accent">{recipeCost.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold text-gray-500">{t('Cost per Liter')}</span>
                                <span className="font-bold text-color-accent">{costPerLiter.toFixed(2)} €</span>
                            </div>
                        </div>
                    </Card>
                    <Card title={t('Process Parameters')} icon={<WrenchIcon className="w-5 h-5"/>}>
                        <div className="space-y-6">
                            {/* Water Profile */}
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary mb-3 border-b border-color-border/50 pb-1">{t('Water Profile')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label={t('Mash Water (Mains, L)')} name="mashWaterMainsL" type="number" step="any" value={formData.processParameters.mashWaterMainsL} onChange={handleProcessParamChange} />
                                    <Input label={t('Mash Water (Mains, µS/cm)')} name="mashWaterMainsMicroSiemens" type="number" step="any" value={formData.processParameters.mashWaterMainsMicroSiemens} onChange={handleProcessParamChange} />
                                    <Input label={t('Mash Water (RO, L)')} name="mashWaterRoL" type="number" step="any" value={formData.processParameters.mashWaterRoL} onChange={handleProcessParamChange} />
                                    <Input label={t('Mash Water (RO, µS/cm)')} name="mashWaterRoMicroSiemens" type="number" step="any" value={formData.processParameters.mashWaterRoMicroSiemens} onChange={handleProcessParamChange} />
                                    <Input label={t('Sparge Water (L)')} name="spargeWaterL" type="number" step="any" value={formData.processParameters.spargeWaterL} onChange={handleProcessParamChange} />
                                    <Input label={t('Sparge Water (µS/cm)')} name="spargeWaterMicroSiemens" type="number" step="any" value={formData.processParameters.spargeWaterMicroSiemens} onChange={handleProcessParamChange} />
                                    <Input label={t('Sparge Water pH')} name="spargeWaterPh" type="number" step="0.01" value={formData.processParameters.spargeWaterPh} onChange={handleProcessParamChange} />
                                </div>
                            </div>
                            
                            {/* Grist & Mash */}
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary mb-3 border-b border-color-border/50 pb-1">{t('Grist & Mash')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label={t('Malt Milling (%)')} name="maltMilling" type="number" step="any" value={formData.processParameters.maltMilling} onChange={handleProcessParamChange} />
                                    <Input label={t('Expected Mash pH')} name="expectedMashPh" type="number" step="0.01" value={formData.processParameters.expectedMashPh} onChange={handleProcessParamChange} />
                                    <Input label={t('Expected Iodine Time (min)')} name="expectedIodineTime" type="number" value={formData.processParameters.expectedIodineTime} onChange={handleProcessParamChange} />
                                </div>
                            </div>

                            {/* Lauter */}
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary mb-3 border-b border-color-border/50 pb-1">{t('Lauter')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label={t('Transfer Duration (min)')} name="transferDuration" type="number" value={formData.processParameters.transferDuration} onChange={handleProcessParamChange} />
                                    <Input label={t('Recirculation Duration (min)')} name="recirculationDuration" type="number" value={formData.processParameters.recirculationDuration} onChange={handleProcessParamChange} />
                                    <Input label={t('Filtration Duration (min)')} name="filtrationDuration" type="number" value={formData.processParameters.filtrationDuration} onChange={handleProcessParamChange} />
                                    <Input label={t('First Wort (°P)')} name="firstWortPlato" type="number" step="0.1" value={formData.processParameters.firstWortPlato} onChange={handleProcessParamChange} />
                                    <Input label={t('First Wort pH')} name="firstWortPh" type="number" step="0.01" value={formData.processParameters.firstWortPh} onChange={handleProcessParamChange} />
                                    <Input label={t('Last Wort (°P)')} name="lastWortPlato" type="number" step="0.1" value={formData.processParameters.lastWortPlato} onChange={handleProcessParamChange} />
                                    <Input label={t('Last Wort pH')} name="lastWortPh" type="number" step="0.01" value={formData.processParameters.lastWortPh} onChange={handleProcessParamChange} />
                                </div>
                            </div>

                            {/* Boil & Cooling */}
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary mb-3 border-b border-color-border/50 pb-1">{t('Boil & Cooling')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label={t('Pre-Boil (L)')} name="preBoilLiters" type="number" step="any" value={formData.processParameters.preBoilLiters} onChange={handleProcessParamChange} />
                                    <Input label={t('Pre-Boil (°P)')} name="preBoilPlato" type="number" step="0.1" value={formData.processParameters.preBoilPlato} onChange={handleProcessParamChange} />
                                    <Input label={t('Pre-boil pH')} name="preBoilPh" type="number" step="0.01" value={formData.processParameters.preBoilPh} onChange={handleProcessParamChange} />
                                    <Input label={t('Post-Boil (L)')} name="postBoilLiters" type="number" step="any" value={formData.processParameters.postBoilLiters} onChange={handleProcessParamChange} />
                                    <Input label={t('Post-Boil (°P)')} name="postBoilPlato" type="number" step="0.1" value={formData.processParameters.postBoilPlato} onChange={handleProcessParamChange} />
                                    <Input label={t('Post-Boil pH')} name="postBoilPh" type="number" step="0.01" value={formData.processParameters.postBoilPh} onChange={handleProcessParamChange} />
                                    <Input label={t('Expected Boil Duration (min)')} name="boilDuration" type="number" value={formData.processParameters.boilDuration} onChange={handleProcessParamChange} />
                                    <Input label={t('Expected Whirlpool Duration (min)')} name="whirlpoolDuration" type="number" value={formData.processParameters.whirlpoolDuration} onChange={handleProcessParamChange} />
                                    <Input label={t('Expected Whirlpool Rest Duration (min)')} name="whirlpoolRestDuration" type="number" value={formData.processParameters.whirlpoolRestDuration} onChange={handleProcessParamChange} />
                                    <Input label={t('Expected Cooling Duration (min)')} name="coolingDuration" type="number" value={formData.processParameters.coolingDuration} onChange={handleProcessParamChange} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
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

export default RecipeFormPage;