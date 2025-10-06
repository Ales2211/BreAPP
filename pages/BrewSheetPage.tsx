import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, LogEntry, MasterItem, WarehouseItem, ActualIngredient, ActualBoilWhirlpoolIngredient, ActualTankIngredient, Category, Unit, PackagedItemActual, Recipe, Location } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, MashTunIcon, DropletIcon, ThermometerIcon, YeastIcon, BottleIcon, DownloadIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

interface BrewSheetPageProps {
  batch: BrewSheet;
  recipes: Recipe[];
  masterItems: MasterItem[];
  warehouseItems: WarehouseItem[];
  categories: Category[];
  locations: Location[];
  onBack: () => void;
  onSave: (batch: BrewSheet) => void;
  onUnloadItems: (items: Omit<WarehouseItem, 'id'>[]) => void;
  onLoadFinishedGoods: (batchId: string, items: Omit<WarehouseItem, 'id'>[]) => void;
}

type UnloadItem = {
    key: number;
    masterItemId: string;
    lotNumber: string;
    quantity: number;
};

const generateUniqueId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const UnloadMaterialsCard: React.FC<{
    masterItems: MasterItem[];
    warehouseItems: WarehouseItem[];
    categories: Category[];
    unloadList: UnloadItem[];
    onAdd: (item: Omit<UnloadItem, 'key'>) => void;
    onRemove: (key: number) => void;
    onConfirm: () => void;
    t: (key: string) => string;
}> = ({ masterItems, warehouseItems, categories, unloadList, onAdd, onRemove, onConfirm, t }) => {

    // FIX: Corrected category name from 'Packaging' to the specific 'Category_Packaging' key.
    const packagingCategoryIds = useMemo(() => categories.filter(c => c.name === 'Category_Packaging').map(c => c.id), [categories]);
    const packagingMasterItems = useMemo(() => masterItems.filter(mi => packagingCategoryIds.includes(mi.categoryId)), [masterItems, packagingCategoryIds]);

    const [selectedItem, setSelectedItem] = useState(packagingMasterItems.length > 0 ? packagingMasterItems[0].id : '');
    const [selectedLot, setSelectedLot] = useState('');
    const [quantity, setQuantity] = useState(0);

    const availableLots = useMemo(() => {
        const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === selectedItem);
        const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
            acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);
    }, [selectedItem, warehouseItems]);

    const handleItemSelectionChange = (itemId: string) => {
        setSelectedItem(itemId);
        setSelectedLot('');
        setQuantity(0);
    }
    
    const handleAddClick = () => {
        onAdd({ masterItemId: selectedItem, lotNumber: selectedLot, quantity });
        setSelectedItem(packagingMasterItems.length > 0 ? packagingMasterItems[0].id : '');
        setSelectedLot('');
        setQuantity(0);
    }

    const selectedMasterItem = masterItems.find(mi => mi.id === selectedItem);
    const selectedLotMaxQty = Number(availableLots.find(([lot]) => lot === selectedLot)?.[1] || 0);

    return (
        <Card title={t('Unload Packaging Materials')}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <Select
                            label={t('Item to Unload')}
                            value={selectedItem}
                            onChange={e => handleItemSelectionChange(e.target.value)}
                        >
                            {packagingMasterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Select
                             label={t('Lot Number')}
                             value={selectedLot}
                             onChange={e => setSelectedLot(e.target.value)}
                             disabled={!selectedItem || availableLots.length === 0}
                        >
                            <option value="">{t('Select Lot')}</option>
                            {availableLots.map(([lot, qty]) => (
                                <option key={lot} value={lot}>
                                    {lot} ({Number(qty).toFixed(2)} {selectedMasterItem?.unit})
                                </option>
                            ))}
                        </Select>
                    </div>
                     <Input 
                        label={t('Unload Quantity')} 
                        type="number" 
                        value={quantity || ''} 
                        onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                        max={selectedLotMaxQty}
                        min="0"
                        disabled={!selectedLot}
                        unit={selectedMasterItem?.unit}
                    />
                </div>
                 <button type="button" onClick={handleAddClick} className="flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>{t('Add to Unload List')}</span>
                </button>
                 {unloadList.length > 0 && (
                    <div className="mt-4">
                        <div className="overflow-x-auto rounded-lg border border-color-border/50">
                            <table className="w-full text-left">
                                <thead className="bg-color-background">
                                    <tr>
                                        <th className="py-2 px-3 text-sm font-semibold">{t('Item Name')}</th>
                                        <th className="py-2 px-3 text-sm font-semibold">{t('Lot Number')}</th>
                                        <th className="py-2 px-3 text-sm font-semibold text-right">{t('Quantity')}</th>
                                        <th className="py-2 px-3 text-sm font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-color-border/50">
                                    {unloadList.map(item => {
                                        const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                                        return (
                                            <tr key={item.key} className="bg-color-background/50">
                                                <td className="py-2 px-3">{masterItem?.name}</td>
                                                <td className="py-2 px-3">{item.lotNumber}</td>
                                                <td className="py-2 px-3 text-right font-mono">{item.quantity.toFixed(2)} {masterItem?.unit}</td>
                                                <td className="py-2 px-3 text-right">
                                                    <button onClick={() => onRemove(item.key)} className="p-1 text-red-500 hover:text-red-400">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={onConfirm} className="mt-4 w-full bg-color-secondary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                            {t('Confirm Unload')}
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};

const BrewSheetPage: React.FC<BrewSheetPageProps> = ({ batch, recipes, masterItems, warehouseItems, categories, locations, onBack, onSave, onUnloadItems, onLoadFinishedGoods }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [currentBatch, setCurrentBatch] = useState<BrewSheet>(batch);
    const [activeTab, setActiveTab] = useState('Mash');
    const [unloadList, setUnloadList] = useState<UnloadItem[]>([]);
    const [isLoadConfirmOpen, setIsLoadConfirmOpen] = useState(false);
    
    useEffect(() => {
        setCurrentBatch(batch);
    }, [batch]);

    // Effect to auto-calculate Best Before Date
    useEffect(() => {
        const packagingDateStr = currentBatch.packagingLog.packagingDate;
        if (packagingDateStr) {
            const recipe = recipes.find(r => r.id === currentBatch.recipeId);
            if (recipe && recipe.shelfLifeDays) {
                const packagingDate = new Date(packagingDateStr);
                packagingDate.setDate(packagingDate.getDate() + recipe.shelfLifeDays);
                const bestBeforeDate = packagingDate.toISOString().split('T')[0];
                
                // Only update if it's different to avoid re-renders
                if (bestBeforeDate !== currentBatch.packagingLog.bestBeforeDate) {
                    handleDeepChange('packagingLog.bestBeforeDate', bestBeforeDate);
                }
            }
        }
    }, [currentBatch.packagingLog.packagingDate, currentBatch.recipeId, recipes]);

    // Helper to safely parse numeric input for optional fields
    const parseNumeric = (value: string): number | undefined => {
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
    };

    // Deep state change handler
    const handleDeepChange = (path: string, value: any) => {
        setCurrentBatch(prev => {
            const newBatch = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let current = newBatch;
            for (let i = 0; i < keys.length - 1; i++) {
                if (current[keys[i]] === undefined) {
                  current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newBatch;
        });
    };
    
    const handleLogChange = (index: number, field: keyof LogEntry, value: any) => {
        const newLogs = [...currentBatch.fermentationLog.actual.logEntries];
        newLogs[index] = { ...newLogs[index], [field]: value };
        handleDeepChange('fermentationLog.actual.logEntries', newLogs);
    }

    const handleActualIngredientQuantityChange = (
        logType: 'mashLog' | 'boilLog',
        index: number,
        value: number
    ) => {
        setCurrentBatch(prev => {
            const newBatch = JSON.parse(JSON.stringify(prev));
            newBatch[logType].actual.ingredients[index].quantity = value;
            return newBatch;
        });
    };
    
    const handleActualAdditionQuantityChange = (
        index: number,
        value: number
    ) => {
        setCurrentBatch(prev => {
            const newBatch = JSON.parse(JSON.stringify(prev));
            newBatch.fermentationLog.actual.additions[index].quantity = value;
            return newBatch;
        });
    };

    const handleActualLotChange = (
        logType: 'mashLog' | 'boilLog' | 'fermentationLog',
        index: number,
        lotNumber: string
    ) => {
        setCurrentBatch(prev => {
            const newBatch = JSON.parse(JSON.stringify(prev));
            const key = logType === 'fermentationLog' ? 'additions' : 'ingredients';
            newBatch[logType].actual[key][index].lotNumber = lotNumber;
            return newBatch;
        });
    };
    
    const addLogEntry = () => {
        const newLog: LogEntry = {
            id: generateUniqueId('log'),
            timestamp: new Date().toISOString(),
            temperature: 0,
            gravity: 0,
            ph: 0,
            notes: '',
        };
        handleDeepChange('fermentationLog.actual.logEntries', [...currentBatch.fermentationLog.actual.logEntries, newLog]);
    }

    const removeLogEntry = (index: number) => {
        const newLogs = currentBatch.fermentationLog.actual.logEntries.filter((_, i) => i !== index);
        handleDeepChange('fermentationLog.actual.logEntries', newLogs);
    }
    
    const handleSave = () => {
        onSave(currentBatch);
    }

    const handleConfirmLoadToWarehouse = () => {
        const finishedGoodsLocation = locations.find(l => l.name.includes('Finished Goods'));
        if (!finishedGoodsLocation) {
            toast.error("Finished Goods warehouse location not found. Please configure it in Settings.");
            return;
        }

        const itemsToLoad: Omit<WarehouseItem, 'id'>[] = currentBatch.packagingLog.packagedItems
            .filter(item => item.quantityGood && item.quantityGood > 0)
            .map(item => ({
                masterItemId: item.masterItemId,
                lotNumber: currentBatch.lot,
                quantity: item.quantityGood!,
                locationId: finishedGoodsLocation.id,
                expiryDate: currentBatch.packagingLog.bestBeforeDate || '',
                documentNumber: `PKG-${currentBatch.lot}`,
                arrivalDate: currentBatch.packagingLog.packagingDate || new Date().toISOString().split('T')[0],
            }));
        
        if (itemsToLoad.length > 0) {
            onLoadFinishedGoods(currentBatch.id, itemsToLoad);
        } else {
            toast.info("No good items to load into the warehouse.");
        }
        setIsLoadConfirmOpen(false);
    };

    // Unload materials handlers
    const handleAddUnloadItem = (item: Omit<UnloadItem, 'key'>) => {
        if (!item.masterItemId || !item.lotNumber || item.quantity <= 0) {
            toast.error('Please select an item, lot, and enter a valid quantity.');
            return;
        }
        setUnloadList(prev => [...prev, { ...item, key: Date.now() }]);
    }

    const handleRemoveUnloadItem = (key: number) => {
        setUnloadList(prev => prev.filter(item => item.key !== key));
    }

    const handleConfirmUnload = () => {
        if (unloadList.length === 0) return;

        const itemsToSave: Omit<WarehouseItem, 'id'>[] = unloadList.map(item => ({
            masterItemId: item.masterItemId,
            lotNumber: item.lotNumber,
            quantity: item.quantity,
            locationId: '', // Not needed for unload, source is implicit from lot
            expiryDate: '', // Not needed for unload
            documentNumber: `PKG-${currentBatch.lot}`,
            arrivalDate: new Date().toISOString().split('T')[0],
        }));
        
        onUnloadItems(itemsToSave);
        setUnloadList([]);
        toast.success(t('Packaging materials unloaded'));
    }

    const tabs = [
        { name: 'Mash', icon: <MashTunIcon className="w-5 h-5"/> },
        { name: 'Lauter', icon: <DropletIcon className="w-5 h-5"/> },
        { name: 'Boil', icon: <ThermometerIcon className="w-5 h-5"/> },
        { name: 'Fermentation', icon: <YeastIcon className="w-5 h-5"/> },
        { name: 'BrewStep_Packaging', icon: <BottleIcon className="w-5 h-5"/> }
    ];
    
    // Memoized packaging calculations
    const packagingSummary = useMemo(() => {
        const summary = {
            litersInCans: 0,
            litersInKegs: 0,
            litersInBottles: 0,
            totalCansUsed: 0,
            totalCansGood: 0,
            totalPackagedLiters: 0,
        };

        const cansId = categories.find(c => c.name === 'Cans')?.id;
        const kegsId = categories.find(c => c.name === 'Kegs')?.id;
        const bottlesId = categories.find(c => c.name === 'Bottles')?.id;
        
        currentBatch.packagingLog.packagedItems.forEach(item => {
            const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
            if (!masterItem) return;

            const itemLiters = (item.quantityGood || 0) * (item.formatLiters || 0);
            
            if (masterItem.categoryId === cansId) {
                summary.litersInCans += itemLiters;
                summary.totalCansUsed += item.quantityUsed || 0;
                summary.totalCansGood += item.quantityGood || 0;
            } else if (masterItem.categoryId === kegsId) {
                summary.litersInKegs += itemLiters;
            } else if (masterItem.categoryId === bottlesId) {
                summary.litersInBottles += itemLiters;
            }
        });
        
        summary.totalPackagedLiters = summary.litersInCans + summary.litersInKegs + summary.litersInBottles;
        
        const summaryExpectedLiters = currentBatch.packagingLog.summaryExpectedLiters || 0;
        const canPercentage = summary.totalPackagedLiters > 0 ? (summary.litersInCans / summary.totalPackagedLiters) * 100 : 0;
        const kegPercentage = summary.totalPackagedLiters > 0 ? (summary.litersInKegs / summary.totalPackagedLiters) * 100 : 0;
        const canWasteCount = summary.totalCansUsed - summary.totalCansGood;
        const canWastePercentage = summary.totalCansUsed > 0 ? (canWasteCount / summary.totalCansUsed) * 100 : 0;
        const totalLoss = summaryExpectedLiters - summary.totalPackagedLiters;
        const totalYield = summaryExpectedLiters > 0 ? (summary.totalPackagedLiters / summaryExpectedLiters) * 100 : 0;

        return {
            ...summary,
            canPercentage,
            kegPercentage,
            canWastePercentage,
            totalLoss,
            totalYield
        }

    }, [currentBatch.packagingLog, masterItems, categories]);


    return (
        <div className="h-full flex flex-col">
            <ConfirmationModal
                isOpen={isLoadConfirmOpen}
                onClose={() => setIsLoadConfirmOpen(false)}
                onConfirm={handleConfirmLoadToWarehouse}
                title={t('Confirm Load to Warehouse')}
                message={t('Load_To_Warehouse_Confirmation')}
            />
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 flex-shrink-0">
                <div className="flex items-center mb-4 sm:mb-0">
                    <button type="button" onClick={onBack} className="p-2 mr-2 md:mr-4 rounded-full hover:bg-color-border transition-colors">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                    <h1 className="text-xl md:text-3xl font-bold text-color-text">
                        {t('Brew Sheet')}: {batch.beerName} - {batch.lot}
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 w-full sm:w-auto">
                    <Select
                        label={t('Status')}
                        value={currentBatch.status}
                        onChange={e => handleDeepChange('status', e.target.value)}
                        containerClassName="w-full sm:w-40"
                    >
                        <option value="Planned">{t('Planned')}</option>
                        <option value="In Progress">{t('In Progress')}</option>
                        <option value="Fermenting">{t('Fermenting')}</option>
                        <option value="Packaged">{t('Packaged')}</option>
                        <option value="Completed">{t('Completed')}</option>
                    </Select>
                    <button onClick={handleSave} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 w-full sm:w-auto">
                        {t('Save Batch')}
                    </button>
                </div>
            </div>
            
            <div className="mb-4 flex-shrink-0">
                <nav className="flex space-x-2 md:space-x-4 bg-color-surface/50 rounded-lg p-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center space-x-2 whitespace-nowrap py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                                activeTab === tab.name ? 'bg-color-accent text-white shadow-md' : 'text-gray-600 hover:bg-color-border/50'
                            }`}
                        >
                            {tab.icon}
                            <span>{t(tab.name)}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {activeTab === 'Mash' && (
                    <Card title={t('Mash')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Expected')}</h4>
                                <p><strong>{t('Expected Mash pH')}:</strong> {currentBatch.mashLog.expected.mashPh}</p>
                                <p><strong>{t('Expected Iodine Time (min)')}:</strong> {currentBatch.mashLog.expected.expectedIodineTime} min</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Actual')}</h4>
                                <Input label={t('Actual Mash pH')} type="number" step="0.01" value={currentBatch.mashLog.actual.mashPh ?? ''} onChange={e => handleDeepChange('mashLog.actual.mashPh', parseNumeric(e.target.value))} />
                                <Input label={t('Actual Iodine Time (min)')} type="number" value={currentBatch.mashLog.actual.iodineTime ?? ''} onChange={e => handleDeepChange('mashLog.actual.iodineTime', parseNumeric(e.target.value))} />
                            </div>
                        </div>
                        <div className="mt-8">
                            <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Ingredients')}</h4>
                            {/* Mobile View */}
                            <div className="space-y-4 md:hidden">
                                {currentBatch.mashLog.expected.ingredients.map((expectedIng, index) => {
                                    const masterItem = masterItems.find(mi => mi.id === expectedIng.masterItemId);
                                    const actualIng = currentBatch.mashLog.actual.ingredients[index];
                                    if (!masterItem || !actualIng) return null;

                                    const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === expectedIng.masterItemId);
                                    const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
                                        acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
                                        return acc;
                                    }, {} as Record<string, number>);
                                    const availableLots = Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);
                                    
                                    return (
                                        <div key={expectedIng.id} className="bg-color-background/50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-bold text-color-accent">{masterItem.name}</h5>
                                                <span className="text-sm text-gray-400">{masterItem.unit}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500">{t('Expected Qty.')}</label>
                                                    <p className="font-mono">{expectedIng.quantity.toFixed(2)}</p>
                                                </div>
                                                <Input label={t('Actual Qty.')} type="number" step="any" value={actualIng.quantity ?? ''} onChange={e => handleActualIngredientQuantityChange('mashLog', index, parseFloat(e.target.value) || 0)} />
                                                <div className="col-span-2">
                                                    <Select label={t('Lot Number')} value={(actualIng as ActualIngredient).lotNumber || ''} onChange={e => handleActualLotChange('mashLog', index, e.target.value)}>
                                                        <option value="">{t('Select Lot')}</option>
                                                        {availableLots.map(([lot, qty]) => (
                                                            <option key={lot} value={lot}>{lot} ({Number(qty).toFixed(2)} {masterItem.unit})</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                             {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-color-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-color-background">
                                        <tr>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Ingredient')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Expected Qty.')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Lot Number')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Actual Qty.')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Unit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-color-border/50">
                                        {currentBatch.mashLog.expected.ingredients.map((expectedIng, index) => {
                                            const masterItem = masterItems.find(mi => mi.id === expectedIng.masterItemId);
                                            const actualIng = currentBatch.mashLog.actual.ingredients[index];
                                            if (!masterItem || !actualIng) return null;

                                            const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === expectedIng.masterItemId);
                                            const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
                                                acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
                                                return acc;
                                            }, {} as Record<string, number>);
                                            const availableLots = Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);

                                            return (
                                                <tr key={expectedIng.id} className="bg-color-background/50 hover:bg-color-border/70">
                                                    <td className="py-2 px-3">{masterItem.name}</td>
                                                    <td className="py-2 px-3 text-right font-mono">{expectedIng.quantity.toFixed(2)}</td>
                                                    <td className="py-2 px-3">
                                                        <Select
                                                            value={(actualIng as ActualIngredient).lotNumber || ''}
                                                            onChange={e => handleActualLotChange('mashLog', index, e.target.value)}
                                                            aria-label={`${t('Lot Number')} for ${masterItem.name}`}
                                                        >
                                                            <option value="">{t('Select Lot')}</option>
                                                            {availableLots.map(([lot, qty]) => (
                                                                <option key={lot} value={lot}>
                                                                    {lot} ({Number(qty).toFixed(2)} {masterItem.unit})
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            className="text-right w-28 py-1 bg-color-surface/80"
                                                            value={actualIng.quantity ?? ''}
                                                            onChange={e => handleActualIngredientQuantityChange('mashLog', index, parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-500">{masterItem.unit}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                )}
                {activeTab === 'Lauter' && (
                     <Card title={t('Lauter')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Expected')}</h4>
                                <p><strong>{t('First Wort (°P)')}:</strong> {currentBatch.lauterLog.expected.firstWortPlato} °P</p>
                                <p><strong>{t('First Wort pH')}:</strong> {currentBatch.lauterLog.expected.firstWortPh}</p>
                                <p><strong>{t('Last Wort (°P)')}:</strong> {currentBatch.lauterLog.expected.lastWortPlato} °P</p>
                                <p><strong>{t('Last Wort pH')}:</strong> {currentBatch.lauterLog.expected.lastWortPh}</p>
                                <p><strong>{t('Transfer Duration (min)')}:</strong> {currentBatch.lauterLog.expected.transferDuration} min</p>
                                <p><strong>{t('Recirculation Duration (min)')}:</strong> {currentBatch.lauterLog.expected.recirculationDuration} min</p>
                                <p><strong>{t('Filtration Duration (min)')}:</strong> {currentBatch.lauterLog.expected.filtrationDuration} min</p>
                            </div>
                             <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Actual')}</h4>
                                <Input label={t('First Wort (°P)')} type="number" step="0.1" value={currentBatch.lauterLog.actual.firstWortPlato ?? ''} onChange={e => handleDeepChange('lauterLog.actual.firstWortPlato', parseNumeric(e.target.value))} />
                                <Input label={t('First Wort pH')} type="number" step="0.01" value={currentBatch.lauterLog.actual.firstWortPh ?? ''} onChange={e => handleDeepChange('lauterLog.actual.firstWortPh', parseNumeric(e.target.value))} />
                                <Input label={t('Last Wort (°P)')} type="number" step="0.1" value={currentBatch.lauterLog.actual.lastWortPlato ?? ''} onChange={e => handleDeepChange('lauterLog.actual.lastWortPlato', parseNumeric(e.target.value))} />
                                <Input label={t('Last Wort pH')} type="number" step="0.01" value={currentBatch.lauterLog.actual.lastWortPh ?? ''} onChange={e => handleDeepChange('lauterLog.actual.lastWortPh', parseNumeric(e.target.value))} />
                                <Input label={t('Transfer Duration (min)')} type="number" value={currentBatch.lauterLog.actual.transferDuration ?? ''} onChange={e => handleDeepChange('lauterLog.actual.transferDuration', parseNumeric(e.target.value))} />
                                <Input label={t('Recirculation Duration (min)')} type="number" value={currentBatch.lauterLog.actual.recirculationDuration ?? ''} onChange={e => handleDeepChange('lauterLog.actual.recirculationDuration', parseNumeric(e.target.value))} />
                                <Input label={t('Filtration Duration (min)')} type="number" value={currentBatch.lauterLog.actual.filtrationDuration ?? ''} onChange={e => handleDeepChange('lauterLog.actual.filtrationDuration', parseNumeric(e.target.value))} />
                            </div>
                        </div>
                    </Card>
                )}
                {activeTab === 'Boil' && (
                    <div className="space-y-6">
                        <Card title={t('Boil')}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Expected')}</h4>
                                    <p><strong>{t('Pre-Boil Liters')}:</strong> {currentBatch.boilLog.expected.preBoilLiters} L</p>
                                    <p><strong>{t('Pre-Boil Plato')}:</strong> {currentBatch.boilLog.expected.preBoilPlato} °P</p>
                                    <p><strong>{t('Pre-boil pH')}:</strong> {currentBatch.boilLog.expected.preBoilPh}</p>
                                    <p><strong>{t('Expected Boil Duration (min)')}:</strong> {currentBatch.boilLog.expected.boilDuration} min</p>
                                    <p><strong>{t('Post-Boil Liters')}:</strong> {currentBatch.boilLog.expected.postBoilLiters} L</p>
                                    <p><strong>{t('Post-Boil Plato')}:</strong> {currentBatch.boilLog.expected.postBoilPlato} °P</p>
                                    <p><strong>{t('Post-Boil pH')}:</strong> {currentBatch.boilLog.expected.postBoilPh}</p>
                                    <p><strong>{t('Expected Whirlpool Duration (min)')}:</strong> {currentBatch.boilLog.expected.whirlpoolDuration} min</p>
                                    <p><strong>{t('Expected Whirlpool Rest Duration (min)')}:</strong> {currentBatch.boilLog.expected.whirlpoolRestDuration} min</p>
                                    <p><strong>{t('Expected Cooling Duration (min)')}:</strong> {currentBatch.boilLog.expected.coolingDuration} min</p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Actual')}</h4>
                                    <Input label={t('Pre-Boil Liters')} type="number" value={currentBatch.boilLog.actual.preBoilLiters ?? ''} onChange={e => handleDeepChange('boilLog.actual.preBoilLiters', parseNumeric(e.target.value))} />
                                    <Input label={t('Pre-Boil Plato')} type="number" step="0.1" value={currentBatch.boilLog.actual.preBoilPlato ?? ''} onChange={e => handleDeepChange('boilLog.actual.preBoilPlato', parseNumeric(e.target.value))} />
                                    <Input label={t('Pre-boil pH')} type="number" step="0.01" value={currentBatch.boilLog.actual.preBoilPh ?? ''} onChange={e => handleDeepChange('boilLog.actual.preBoilPh', parseNumeric(e.target.value))} />
                                    <Input label={t('Boil Start Time')} type="datetime-local" value={currentBatch.boilLog.actual.boilStartTime ?? ''} onChange={e => handleDeepChange('boilLog.actual.boilStartTime', e.target.value)} />
                                    <Input label={t('Boil End Time')} type="datetime-local" value={currentBatch.boilLog.actual.boilEndTime ?? ''} onChange={e => handleDeepChange('boilLog.actual.boilEndTime', e.target.value)} />
                                    <Input label={t('Post-Boil Liters')} type="number" value={currentBatch.boilLog.actual.postBoilLiters ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilLiters', parseNumeric(e.target.value))} />
                                    <Input label={t('Post-Boil Plato')} type="number" step="0.1" value={currentBatch.boilLog.actual.postBoilPlato ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilPlato', parseNumeric(e.target.value))} />
                                    <Input label={t('Post-Boil pH')} type="number" step="0.01" value={currentBatch.boilLog.actual.postBoilPh ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilPh', parseNumeric(e.target.value))} />
                                    <Input label={t('Actual Whirlpool Duration (min)')} type="number" value={currentBatch.boilLog.actual.whirlpoolDuration ?? ''} onChange={e => handleDeepChange('boilLog.actual.whirlpoolDuration', parseNumeric(e.target.value))} />
                                    <Input label={t('Actual Whirlpool Rest Duration (min)')} type="number" value={currentBatch.boilLog.actual.whirlpoolRestDuration ?? ''} onChange={e => handleDeepChange('boilLog.actual.whirlpoolRestDuration', parseNumeric(e.target.value))} />
                                    <Input label={t('Actual Cooling Duration (min)')} type="number" value={currentBatch.boilLog.actual.coolingDuration ?? ''} onChange={e => handleDeepChange('boilLog.actual.coolingDuration', parseNumeric(e.target.value))} />
                                </div>
                            </div>
                            <div className="mt-8">
                                <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Ingredients')}</h4>
                                {/* Mobile View */}
                                <div className="space-y-4 md:hidden">
                                    {currentBatch.boilLog.expected.ingredients.map((expectedIng, index) => {
                                        const masterItem = masterItems.find(mi => mi.id === expectedIng.masterItemId);
                                        const actualIng = currentBatch.boilLog.actual.ingredients[index];
                                        if (!masterItem || !actualIng) return null;

                                        const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === expectedIng.masterItemId);
                                        const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
                                            acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
                                            return acc;
                                        }, {} as Record<string, number>);
                                        const availableLots = Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);
                                        
                                        return (
                                            <div key={expectedIng.id} className="bg-color-background/50 p-3 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h5 className="font-bold text-color-accent">{masterItem.name}</h5>
                                                        <p className="text-xs text-gray-400">{t(expectedIng.type)} - {expectedIng.timing} min {expectedIng.temperature ? `@ ${expectedIng.temperature}°C` : ''}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-400">{masterItem.unit}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-500">{t('Expected Qty.')}</label>
                                                        <p className="font-mono">{expectedIng.quantity.toFixed(2)}</p>
                                                    </div>
                                                    <Input label={t('Actual Qty.')} type="number" step="any" value={actualIng.quantity ?? ''} onChange={e => handleActualIngredientQuantityChange('boilLog', index, parseFloat(e.target.value) || 0)} />
                                                    <div className="col-span-2">
                                                        <Select label={t('Lot Number')} value={(actualIng as ActualIngredient).lotNumber || ''} onChange={e => handleActualLotChange('boilLog', index, e.target.value)}>
                                                            <option value="">{t('Select Lot')}</option>
                                                            {availableLots.map(([lot, qty]) => (
                                                                <option key={lot} value={lot}>{lot} ({Number(qty).toFixed(2)} {masterItem.unit})</option>
                                                            ))}
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop View */}
                                <div className="hidden md:block overflow-x-auto rounded-lg border border-color-border/50">
                                    <table className="w-full text-left">
                                        <thead className="bg-color-background">
                                            <tr>
                                                <th className="py-2 px-3 text-sm font-semibold">{t('Ingredient')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold">{t('Type')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold text-right">{t('Timing')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold text-right">{t('Temp.')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold text-right">{t('Expected Qty.')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold">{t('Lot Number')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold text-right">{t('Actual Qty.')}</th>
                                                <th className="py-2 px-3 text-sm font-semibold">{t('Unit')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-color-border/50">
                                            {currentBatch.boilLog.expected.ingredients.map((expectedIng, index) => {
                                                const masterItem = masterItems.find(mi => mi.id === expectedIng.masterItemId);
                                                const actualIng = currentBatch.boilLog.actual.ingredients[index];
                                                if (!masterItem || !actualIng) return null;

                                                const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === expectedIng.masterItemId);
                                                const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
                                                    acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
                                                    return acc;
                                                }, {} as Record<string, number>);
                                                const availableLots = Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);

                                                return (
                                                    <tr key={expectedIng.id} className="bg-color-background/50 hover:bg-color-border/70">
                                                        <td className="py-2 px-3">{masterItem.name}</td>
                                                        <td className="py-2 px-3">{t(expectedIng.type)}</td>
                                                        <td className="py-2 px-3 text-right font-mono">{expectedIng.timing} min</td>
                                                        <td className="py-2 px-3 text-right font-mono">{expectedIng.temperature ? `${expectedIng.temperature}°C` : '-'}</td>
                                                        <td className="py-2 px-3 text-right font-mono">{expectedIng.quantity.toFixed(2)}</td>
                                                        <td className="py-2 px-3">
                                                            <Select
                                                                value={(actualIng as ActualBoilWhirlpoolIngredient).lotNumber || ''}
                                                                onChange={e => handleActualLotChange('boilLog', index, e.target.value)}
                                                                aria-label={`${t('Lot Number')} for ${masterItem.name}`}
                                                            >
                                                                <option value="">{t('Select Lot')}</option>
                                                                {availableLots.map(([lot, qty]) => (
                                                                    <option key={lot} value={lot}>
                                                                        {lot} ({Number(qty).toFixed(2)} {masterItem.unit})
                                                                    </option>
                                                                ))}
                                                            </Select>
                                                        </td>
                                                        <td className="py-2 px-3 text-right">
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                className="text-right w-28 py-1 bg-color-surface/80"
                                                                value={actualIng.quantity ?? ''}
                                                                onChange={e => handleActualIngredientQuantityChange('boilLog', index, parseFloat(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td className="py-2 px-3 text-gray-500">{masterItem.unit}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Card>
                        <Card title={t('Cooling')}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-4 items-center border-b border-color-border/50 pb-2">
                                    <div className="text-sm font-semibold text-gray-500 col-span-1"></div>
                                    <div className="text-sm font-semibold text-gray-500 text-center">{t('Start')}</div>
                                    <div className="text-sm font-semibold text-gray-500 text-center">{t('End')}</div>
                                    <div className="text-sm font-semibold text-gray-500 text-center">{t('Liters')}</div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <label className="font-medium text-color-text col-span-1">{t('WashingLiterCounter')}:</label>
                                    <Input
                                        type="number"
                                        className="text-center"
                                        value={currentBatch.boilLog.actual.coolingWashingCounterStart ?? ''}
                                        onChange={e => handleDeepChange('boilLog.actual.coolingWashingCounterStart', parseNumeric(e.target.value))}
                                    />
                                    <Input
                                        type="number"
                                        className="text-center"
                                        value={currentBatch.boilLog.actual.coolingWashingCounterEnd ?? ''}
                                        onChange={e => handleDeepChange('boilLog.actual.coolingWashingCounterEnd', parseNumeric(e.target.value))}
                                    />
                                    <div className="text-center font-bold font-mono text-lg text-color-accent p-2 bg-color-background rounded-md border border-color-border/50">
                                        {(currentBatch.boilLog.actual.coolingWashingCounterEnd || 0) - (currentBatch.boilLog.actual.coolingWashingCounterStart || 0)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <label className="font-medium text-color-text col-span-1">{t('WortLiterCounter')}:</label>
                                    <Input
                                        type="number"
                                        className="text-center"
                                        value={currentBatch.boilLog.actual.coolingWortCounterStart ?? ''}
                                        onChange={e => handleDeepChange('boilLog.actual.coolingWortCounterStart', parseNumeric(e.target.value))}
                                    />
                                    <Input
                                        type="number"
                                        className="text-center"
                                        value={currentBatch.boilLog.actual.coolingWortCounterEnd ?? ''}
                                        onChange={e => handleDeepChange('boilLog.actual.coolingWortCounterEnd', parseNumeric(e.target.value))}
                                    />
                                    <div className="text-center font-bold font-mono text-lg text-color-accent p-2 bg-color-background rounded-md border border-color-border/50">
                                        {(currentBatch.boilLog.actual.coolingWortCounterEnd || 0) - (currentBatch.boilLog.actual.coolingWortCounterStart || 0)}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
                 {activeTab === 'Fermentation' && (
                     <Card title={t('Fermentation')}>
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Expected Steps')}</h4>
                            <div className="overflow-x-auto rounded-lg border border-color-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-color-background">
                                        <tr>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Step Description')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Temperature (°C)')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Pressure (Bar)')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Days')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-color-border/50">
                                        {currentBatch.fermentationLog.expected.steps.map((step) => (
                                            <tr key={step.id} className="bg-color-background/50">
                                                <td className="py-2 px-3">{step.description}</td>
                                                <td className="py-2 px-3 text-right font-mono">{step.temperature}°C</td>
                                                <td className="py-2 px-3 text-right font-mono">{step.pressure} Bar</td>
                                                <td className="py-2 px-3 text-right font-mono">{step.days}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Additions')}</h4>
                             {/* Mobile View */}
                            <div className="space-y-4 md:hidden">
                                {currentBatch.fermentationLog.expected.additions.map((expectedAdd, index) => {
                                    const masterItem = masterItems.find(mi => mi.id === expectedAdd.masterItemId);
                                    const actualAdd = currentBatch.fermentationLog.actual.additions[index];
                                    if (!masterItem || !actualAdd) return null;

                                    const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === expectedAdd.masterItemId);
                                    const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
                                        acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
                                        return acc;
                                    }, {} as Record<string, number>);
                                    const availableLots = Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);
                                    
                                    return (
                                        <div key={expectedAdd.id} className="bg-color-background/50 p-3 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className="font-bold text-color-accent">{masterItem.name}</h5>
                                                    <p className="text-xs text-gray-400">{t('Day')} {expectedAdd.day}</p>
                                                </div>
                                                <span className="text-sm text-gray-400">{masterItem.unit}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500">{t('Expected Qty.')}</label>
                                                    <p className="font-mono">{expectedAdd.quantity.toFixed(2)}</p>
                                                </div>
                                                <Input label={t('Actual Qty.')} type="number" step="any" value={actualAdd.quantity ?? ''} onChange={e => handleActualAdditionQuantityChange(index, parseFloat(e.target.value) || 0)} />
                                                <div className="col-span-2">
                                                    <Select label={t('Lot Number')} value={(actualAdd as ActualIngredient).lotNumber || ''} onChange={e => handleActualLotChange('fermentationLog', index, e.target.value)}>
                                                        <option value="">{t('Select Lot')}</option>
                                                        {availableLots.map(([lot, qty]) => (
                                                            <option key={lot} value={lot}>{lot} ({Number(qty).toFixed(2)} {masterItem.unit})</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop View */}
                             <div className="hidden md:block overflow-x-auto rounded-lg border border-color-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-color-background">
                                        <tr>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Ingredient')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Day')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Expected Qty.')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Lot Number')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold text-right">{t('Actual Qty.')}</th>
                                            <th className="py-2 px-3 text-sm font-semibold">{t('Unit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-color-border/50">
                                        {currentBatch.fermentationLog.expected.additions.map((expectedAdd, index) => {
                                            const masterItem = masterItems.find(mi => mi.id === expectedAdd.masterItemId);
                                            const actualAdd = currentBatch.fermentationLog.actual.additions[index];
                                            if (!masterItem || !actualAdd) return null;

                                            const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === expectedAdd.masterItemId);
                                            const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
                                                acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
                                                return acc;
                                            }, {} as Record<string, number>);
                                            const availableLots = Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);

                                            return (
                                                <tr key={expectedAdd.id} className="bg-color-background/50 hover:bg-color-border/70">
                                                    <td className="py-2 px-3">{masterItem.name}</td>
                                                    <td className="py-2 px-3 text-right font-mono">{expectedAdd.day}</td>
                                                    <td className="py-2 px-3 text-right font-mono">{expectedAdd.quantity.toFixed(2)}</td>
                                                    <td className="py-2 px-3">
                                                        <Select
                                                            value={(actualAdd as ActualTankIngredient).lotNumber || ''}
                                                            onChange={e => handleActualLotChange('fermentationLog', index, e.target.value)}
                                                            aria-label={`${t('Lot Number')} for ${masterItem.name}`}
                                                        >
                                                            <option value="">{t('Select Lot')}</option>
                                                            {availableLots.map(([lot, qty]) => (
                                                                <option key={lot} value={lot}>
                                                                    {lot} ({Number(qty).toFixed(2)} {masterItem.unit})
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            className="text-right w-28 py-1 bg-color-surface/80"
                                                            value={actualAdd.quantity ?? ''}
                                                            onChange={e => handleActualAdditionQuantityChange(index, parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-500">{masterItem.unit}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                         <h4 className="text-lg font-semibold text-color-secondary mb-2">{t('Fermentation Log')}</h4>
                         <div className="space-y-3">
                            {currentBatch.fermentationLog.actual.logEntries.map((log, index) => (
                                <div key={log.id} className="bg-color-background p-3 rounded-lg flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center">
                                    <Input containerClassName="md:col-span-3" label={t('Timestamp')} type="datetime-local" value={new Date(log.timestamp).toISOString().slice(0, 16)} onChange={e => handleLogChange(index, 'timestamp', new Date(e.target.value).toISOString())}/>
                                    <Input containerClassName="md:col-span-2" label={t('Temperature (°C)')} type="number" step="0.1" unit="°C" value={log.temperature ?? ''} onChange={e => handleLogChange(index, 'temperature', parseNumeric(e.target.value))}/>
                                    <Input containerClassName="md:col-span-2" label={t('Gravity (°P)')} type="number" step="0.1" value={log.gravity ?? ''} onChange={e => handleLogChange(index, 'gravity', parseNumeric(e.target.value))}/>
                                    <Input containerClassName="md:col-span-2" label={t('pH')} type="number" step="0.01" value={log.ph ?? ''} onChange={e => handleLogChange(index, 'ph', parseNumeric(e.target.value))}/>
                                    <Input containerClassName="md:col-span-2" label={t('Notes')} value={log.notes ?? ''} onChange={e => handleLogChange(index, 'notes', e.target.value)}/>
                                    <div className="md:col-span-1 flex items-end justify-end">
                                        <button onClick={() => removeLogEntry(index)} className="p-2 text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                         </div>
                         <button onClick={addLogEntry} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                            <PlusCircleIcon className="w-5 h-5"/>
                            <span>{t('Add Log Entry')}</span>
                         </button>
                     </Card>
                 )}
                 {activeTab === 'BrewStep_Packaging' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card title={t('Packaging Log')}>
                                <div className="space-y-4">
                                    <Input label={t('Tank pressure')} type="number" step="any" value={currentBatch.packagingLog.tankPressure ?? ''} onChange={e => handleDeepChange('packagingLog.tankPressure', parseNumeric(e.target.value))} />
                                    <Input label={t('Saturation pressure and time')} value={currentBatch.packagingLog.saturation ?? ''} onChange={e => handleDeepChange('packagingLog.saturation', e.target.value)} />
                                </div>
                            </Card>

                             <Card title={t('Packaged Items Log')}>
                                <div className="space-y-4">
                                    {currentBatch.packagingLog.packagedItems.map((item, index) => {
                                        const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                                        return (
                                            <div key={item.id} className="bg-color-background p-3 rounded-md">
                                                <p className="font-bold text-color-secondary mb-2">{masterItem?.name || t('Unknown Item')}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <Input label={t('Format (L)')} type="number" step="any" value={item.formatLiters ?? ''} onChange={e => handleDeepChange(`packagingLog.packagedItems.${index}.formatLiters`, parseFloat(e.target.value) || 0)} />
                                                    <Input label={t('Quantity Used')} type="number" value={item.quantityUsed ?? ''} onChange={e => handleDeepChange(`packagingLog.packagedItems.${index}.quantityUsed`, parseInt(e.target.value, 10) || 0)} />
                                                    <Input label={t('Quantity Good')} type="number" value={item.quantityGood ?? ''} onChange={e => handleDeepChange(`packagingLog.packagedItems.${index}.quantityGood`, parseInt(e.target.value, 10) || 0)} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <div className="space-y-4">
                                    <Input label={t('Packaging Date')} type="date" value={currentBatch.packagingLog.packagingDate ?? ''} onChange={e => handleDeepChange('packagingLog.packagingDate', e.target.value)} />
                                    <Input label={t('Best Before Date')} type="date" value={currentBatch.packagingLog.bestBeforeDate ?? ''} onChange={e => handleDeepChange('packagingLog.bestBeforeDate', e.target.value)} />
                                </div>
                            </Card>
                             <Card title={t('Summary')}>
                                {currentBatch.packagingLog.packagingLoadedToWarehouse && (
                                    <div className="text-xs text-center text-green-800 bg-green-100 rounded-md py-1 mb-3">
                                        ✓ {t('Loaded to Warehouse')}
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-left">
                                            <tr>
                                                <th className="py-1"></th>
                                                <th className="py-1 text-right font-semibold text-gray-500">{t('Expected')}</th>
                                                <th className="py-1 text-right font-semibold text-gray-500">{t('Actual')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-color-border/50">
                                            {[
                                                { label: t('Packaged Liters (lt)'), expected: (currentBatch.packagingLog.summaryExpectedLiters || 0).toFixed(2), actual: packagingSummary.totalPackagedLiters.toFixed(2) },
                                                { label: t('Can Percentage (%)'), expected: '-', actual: packagingSummary.canPercentage.toFixed(2) + ' %' },
                                                { label: t('Can Waste Percentage (%)'), expected: '-', actual: packagingSummary.canWastePercentage.toFixed(2) + ' %' },
                                                { label: t('Keg Percentage (%)'), expected: '-', actual: packagingSummary.kegPercentage.toFixed(2) + ' %' },
                                                { label: t('Total Loss (lt)'), expected: '-', actual: packagingSummary.totalLoss.toFixed(2) },
                                                { label: t('Packaging_Yield_Percent'), expected: '-', actual: packagingSummary.totalYield.toFixed(2) + ' %' },
                                            ].map(item => (
                                                <tr key={item.label}>
                                                    <td className="py-2 font-medium">{item.label}</td>
                                                    <td className="py-2 text-right font-mono text-gray-500">{item.expected}</td>
                                                    <td className="py-2 text-right font-mono font-bold">{item.actual}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsLoadConfirmOpen(true)}
                                    disabled={currentBatch.packagingLog.packagingLoadedToWarehouse}
                                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    <span>{t('Load to Warehouse')}</span>
                                </button>
                            </Card>
                        </div>
                        <div className="lg:col-span-3">
                             <Card title={t('Notes')}>
                                <textarea
                                    value={currentBatch.packagingLog.notes || ''}
                                    onChange={e => handleDeepChange('packagingLog.notes', e.target.value)}
                                    rows={4}
                                    className="w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:ring-2 focus:ring-color-accent transition-colors"
                                    placeholder={t('Enter any packaging notes here...')}
                                />
                            </Card>
                        </div>
                        <div className="lg:col-span-3">
                            <UnloadMaterialsCard 
                                masterItems={masterItems}
                                warehouseItems={warehouseItems}
                                categories={categories}
                                unloadList={unloadList}
                                onAdd={handleAddUnloadItem}
                                onRemove={handleRemoveUnloadItem}
                                onConfirm={handleConfirmUnload}
                                t={t}
                            />
                        </div>
                     </div>
                 )}
            </div>
        </div>
    )
};

export default BrewSheetPage;
