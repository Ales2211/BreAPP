import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, LogEntry, MasterItem, WarehouseItem, ActualIngredient, ActualBoilWhirlpoolIngredient, ActualTankIngredient, Category, Unit, PackagedItemActual, Recipe, Location, LotAssignment, Ingredient, MashStep } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, MashTunIcon, DropletIcon, ThermometerIcon, YeastIcon, BottleIcon, DownloadIcon, ArrowRightIcon, WrenchIcon } from '../components/Icons';

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
  onLoadFinishedGoods: (items: Omit<WarehouseItem, 'id'>[]) => void;
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

const StatusWizardModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    batch: BrewSheet;
    onConfirm: (newStatus: BrewSheet['status']) => void;
    t: (key: string) => string;
}> = ({ isOpen, onClose, batch, onConfirm, t }) => {
    
    const { status: currentStatus } = batch;
    let nextStatus: BrewSheet['status'] | null = null;
    let title = '';
    let message = '';
    let confirmText = '';
    
    switch (currentStatus) {
        case 'Planned':
            nextStatus = 'In Progress';
            title = t('Start Brew Day?');
            message = `${t('This will change the status to "In Progress" and marks the beginning of the brew day for lot')} ${batch.lot}.`;
            confirmText = t('Start Brew Day');
            break;
        case 'In Progress':
            nextStatus = 'Fermenting';
            title = t('Move to Fermentation?');
            message = t('This will change the status to "Fermenting", indicating the brew day is complete.');
            confirmText = t('Start Fermentation');
            break;
        case 'Fermenting':
            nextStatus = 'Packaged';
            title = t('Start Packaging?');
            message = t('This will change the status to "Packaged" and automatically set today as the packaging date.');
            confirmText = t('Start Packaging');
            break;
        case 'Packaged':
            nextStatus = 'Completed';
            title = t('Complete Batch?');
            message = t('This will mark the batch as "Completed" and archive it. Ensure all data is finalized.');
            confirmText = t('Complete Batch');
            break;
    }

    const handleConfirm = () => {
        if (nextStatus) {
            onConfirm(nextStatus);
        }
    };
    
    const statusPill = (status: BrewSheet['status']) => (
        <span className="font-bold text-color-accent px-2 py-1 bg-color-background rounded-md border border-color-border">{t(status)}</span>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            {nextStatus ? (
                <>
                    <div className="flex items-center justify-center space-x-4 my-4 text-lg">
                        {statusPill(currentStatus)}
                        <ArrowRightIcon className="w-6 h-6 text-gray-400"/>
                        {statusPill(nextStatus)}
                    </div>
                    <p className="text-gray-500 mb-6 text-center">{message}</p>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                        <button type="button" onClick={handleConfirm} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{confirmText}</button>
                    </div>
                </>
            ) : (
                 <>
                    <p className="text-gray-500 mb-6 text-center">{t('This batch is completed and archived. No further status changes are possible.')}</p>
                     <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Close')}</button>
                    </div>
                </>
            )}
        </Modal>
    );
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

    const packagingCategoryIds = useMemo(() => {
        const parent = categories.find(c => c.name === 'Category_Packaging');
        return parent ? [parent.id] : [];
    }, [categories]);
    
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


const LotAssignmentManager: React.FC<{
    ingredients: ActualIngredient[];
    expectedIngredients: Ingredient[];
    masterItems: MasterItem[];
    warehouseItems: WarehouseItem[];
    onUpdate: (updatedIngredients: ActualIngredient[]) => void;
    t: (key: string) => string;
}> = ({ ingredients, expectedIngredients, masterItems, warehouseItems, onUpdate, t }) => {

    const handleLotAssignmentChange = (ingId: string, assignIndex: number, field: keyof LotAssignment, value: any) => {
        const newIngredients = [...ingredients];
        const ingIndex = newIngredients.findIndex(i => i.id === ingId);
        if (ingIndex === -1) return;

        const newAssignments = [...newIngredients[ingIndex].lotAssignments];
        newAssignments[assignIndex] = { ...newAssignments[assignIndex], [field]: value };
        newIngredients[ingIndex].lotAssignments = newAssignments;
        onUpdate(newIngredients);
    };

    const addLotAssignment = (ingId: string) => {
        const newIngredients = [...ingredients];
        const ingIndex = newIngredients.findIndex(i => i.id === ingId);
        if (ingIndex === -1) return;

        newIngredients[ingIndex].lotAssignments.push({ id: generateUniqueId('lot'), lotNumber: '', quantity: 0 });
        onUpdate(newIngredients);
    };

    const removeLotAssignment = (ingId: string, assignIndex: number) => {
        const newIngredients = [...ingredients];
        const ingIndex = newIngredients.findIndex(i => i.id === ingId);
        if (ingIndex === -1) return;

        newIngredients[ingIndex].lotAssignments = newIngredients[ingIndex].lotAssignments.filter((_, i) => i !== assignIndex);
        onUpdate(newIngredients);
    };

    return (
        <div className="space-y-4">
            {expectedIngredients.map(expectedIng => {
                const actualIng = ingredients.find(i => i.id === expectedIng.id);
                const masterItem = masterItems.find(mi => mi.id === expectedIng.masterItemId);
                if (!masterItem || !actualIng) return null;

                const totalAssigned = actualIng.lotAssignments.reduce((sum, lot) => sum + (lot.quantity || 0), 0);
                const isComplete = Math.abs(totalAssigned - expectedIng.quantity) < 0.001;
                
                const availableLots = warehouseItems
                    .filter(whItem => whItem.masterItemId === expectedIng.masterItemId && whItem.quantity > 0)
                    .map(item => item.lotNumber)
                    .filter((value, index, self) => self.indexOf(value) === index);
                
                const sackCount = (masterItem.format && masterItem.format > 0) 
                    ? (expectedIng.quantity / masterItem.format).toFixed(1) 
                    : null;

                return (
                    <div key={expectedIng.id} className="bg-color-background/50 p-3 rounded-lg border border-color-border/30">
                        {/* Compact Header */}
                        <div className="flex justify-between items-start mb-2 flex-wrap gap-y-1">
                            <div className="flex-1 min-w-0">
                               <div className="flex items-baseline space-x-4">
                                    <h5 className="font-bold text-md text-color-text truncate">{masterItem.name}</h5>
                                    <div className={`text-sm font-semibold text-right ${isComplete ? 'text-green-500' : 'text-orange-500'}`}>
                                        <p><span className="font-mono">{totalAssigned.toFixed(2)} / {expectedIng.quantity.toFixed(2)}</span> {masterItem.unit}</p>
                                    </div>
                                </div>
                                {<p className="text-xs text-gray-500">{t('Expected')}: {expectedIng.quantity.toFixed(2)} {masterItem.unit} {sackCount ? `/ ≈ ${sackCount} ${t('sacks')}` : ''}</p>}
                            </div>
                        </div>


                        {/* Lot Assignments List */}
                        <div className="space-y-2">
                             {actualIng.lotAssignments.length > 0 && (
                                <div className="grid grid-cols-12 gap-2 items-center text-xs text-gray-500 font-semibold px-1">
                                    <div className="col-span-7">{t('Lot Number')}</div>
                                    <div className="col-span-3">{t('Quantity')}</div>
                                    <div className="col-span-2"></div>
                                </div>
                            )}
                            {actualIng.lotAssignments.map((assignment, assignIndex) => (
                                <div key={assignment.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-7">
                                        <Select
                                            value={assignment.lotNumber}
                                            onChange={e => handleLotAssignmentChange(actualIng.id, assignIndex, 'lotNumber', e.target.value)}
                                            className="w-full py-1 text-sm"
                                            aria-label={`${t('Lot Number')} for ${masterItem.name}`}
                                        >
                                            <option value="">{t('Select Lot')}</option>
                                            {availableLots.map(lot => <option key={lot} value={lot}>{lot}</option>)}
                                        </Select>
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={assignment.quantity || ''}
                                            onChange={e => handleLotAssignmentChange(actualIng.id, assignIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                            unit={masterItem.unit}
                                            className="py-1 text-sm"
                                            aria-label={`${t('Quantity')} for ${masterItem.name} lot ${assignment.lotNumber}`}
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeLotAssignment(actualIng.id, assignIndex)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                            aria-label={`Remove lot for ${masterItem.name}`}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Lot Button */}
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => addLotAssignment(actualIng.id)}
                                className="flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors"
                            >
                                <PlusCircleIcon className="w-5 h-5" />
                                <span>{t('Add Lot')}</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const BrewSheetPage: React.FC<BrewSheetPageProps> = ({ batch, recipes, masterItems, warehouseItems, categories, locations, onBack, onSave, onUnloadItems, onLoadFinishedGoods }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [currentBatch, setCurrentBatch] = useState<BrewSheet>(batch);
    const [activeTab, setActiveTab] = useState('Mash');
    const [unloadList, setUnloadList] = useState<UnloadItem[]>([]);
    const [isStatusWizardOpen, setIsStatusWizardOpen] = useState(false);
    
    useEffect(() => {
        setCurrentBatch(batch);
    }, [batch]);

    useEffect(() => {
        const packagingDateStr = currentBatch.packagingLog.packagingDate;
        if (packagingDateStr) {
            const recipe = recipes.find(r => r.id === currentBatch.recipeId);
            if (recipe && recipe.shelfLifeDays) {
                const packagingDate = new Date(packagingDateStr);
                packagingDate.setDate(packagingDate.getDate() + recipe.shelfLifeDays);
                const bestBeforeDate = packagingDate.toISOString().split('T')[0];
                if (bestBeforeDate !== currentBatch.packagingLog.bestBeforeDate) {
                    handleDeepChange('packagingLog.bestBeforeDate', bestBeforeDate);
                }
            }
        }
    }, [currentBatch.packagingLog.packagingDate, currentBatch.recipeId, recipes]);

    const handleDeepChange = (path: string, value: any) => {
        setCurrentBatch(prev => {
            const newBatch = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let current = newBatch;
            for (let i = 0; i < keys.length - 1; i++) {
                if (current[keys[i]] === undefined) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newBatch;
        });
    };
    
    const handleStatusUpdate = (newStatus: BrewSheet['status']) => {
        setCurrentBatch(prev => {
            const newBatch = JSON.parse(JSON.stringify(prev));
            newBatch.status = newStatus;
            // Automation: Set packaging date when moving to 'Packaged'
            if (prev.status === 'Fermenting' && newStatus === 'Packaged' && !newBatch.packagingLog.packagingDate) {
                newBatch.packagingLog.packagingDate = new Date().toISOString().split('T')[0];
            }
            return newBatch;
        });
        setIsStatusWizardOpen(false);
    };
    
    const parseNumeric = (value: string): number | undefined => {
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
    };

    const handleLogChange = (index: number, field: keyof LogEntry, value: any) => {
        const newLogs = [...currentBatch.fermentationLog.actual.logEntries];
        newLogs[index] = { ...newLogs[index], [field]: value };
        handleDeepChange('fermentationLog.actual.logEntries', newLogs);
    }

    const addLogEntry = () => {
        const newLog: LogEntry = {
            id: generateUniqueId('log'),
            timestamp: new Date().toISOString(),
            temperature: 0, gravity: 0, ph: 0, notes: '',
        };
        handleDeepChange('fermentationLog.actual.logEntries', [...currentBatch.fermentationLog.actual.logEntries, newLog]);
    }

    const removeLogEntry = (index: number) => {
        const newLogs = currentBatch.fermentationLog.actual.logEntries.filter((_, i) => i !== index);
        handleDeepChange('fermentationLog.actual.logEntries', newLogs);
    }
    
    const handleSave = () => { onSave(currentBatch); }

    const handleAddUnloadItem = (item: Omit<UnloadItem, 'key'>) => {
        if (!item.masterItemId || !item.lotNumber || item.quantity <= 0) {
            toast.error('Please select an item, lot, and enter a valid quantity.');
            return;
        }
        setUnloadList(prev => [...prev, { ...item, key: Date.now() }]);
    }

    const handleRemoveUnloadItem = (key: number) => { setUnloadList(prev => prev.filter(item => item.key !== key)); }

    const handleConfirmUnload = () => {
        if (unloadList.length === 0) return;
        const itemsToSave: Omit<WarehouseItem, 'id'>[] = unloadList.map(item => ({
            masterItemId: item.masterItemId, lotNumber: item.lotNumber, quantity: item.quantity,
            locationId: '', expiryDate: '', documentNumber: `PKG-${currentBatch.lot}`,
            arrivalDate: new Date().toISOString().split('T')[0],
        }));
        onUnloadItems(itemsToSave);
        setUnloadList([]);
        toast.success(t('Packaging materials unloaded'));
    }
    
    const areAllQuantitiesAssigned = (stage: 'mash' | 'boil' | 'fermentation'): boolean => {
        const ingredients = stage === 'mash' ? currentBatch.mashLog.actual.ingredients : stage === 'boil' ? currentBatch.boilLog.actual.ingredients : currentBatch.fermentationLog.actual.additions;
        const expectedIngredients = stage === 'mash' ? currentBatch.mashLog.expected.ingredients : stage === 'boil' ? currentBatch.boilLog.expected.ingredients : currentBatch.fermentationLog.expected.additions;
        if (ingredients.length === 0) return true;
        if (ingredients.length !== expectedIngredients.length) return false;

        return ingredients.every(actualIng => {
            const expectedIng = expectedIngredients.find(exp => exp.id === actualIng.id);
            if (!expectedIng || expectedIng.quantity <= 0) return true;
            if (actualIng.lotAssignments.length === 0) return false;
            
            const totalAssigned = actualIng.lotAssignments.reduce((sum, lot) => sum + (lot.quantity || 0), 0);
            return Math.abs(totalAssigned - expectedIng.quantity) < 0.001 && actualIng.lotAssignments.every(l => l.lotNumber);
        });
    };
    
    const handleUnloadForStage = (stage: 'mash' | 'boil' | 'fermentation') => {
        const ingredients = stage === 'mash' ? currentBatch.mashLog.actual.ingredients : stage === 'boil' ? currentBatch.boilLog.actual.ingredients : currentBatch.fermentationLog.actual.additions;
        const stageName = stage === 'mash' ? t('Mash') : stage === 'boil' ? t('Boil') : t('Fermentation');

        const itemsToUnload = ingredients
            .flatMap(ing => ing.lotAssignments.map(assignment => ({
                masterItemId: ing.masterItemId, lotNumber: assignment.lotNumber, quantity: assignment.quantity,
                locationId: '', expiryDate: '', documentNumber: `BREW-${currentBatch.lot}`, arrivalDate: currentBatch.cookDate,
            })))
            .filter(item => item.quantity > 0 && item.lotNumber);

        if (itemsToUnload.length > 0) {
            onUnloadItems(itemsToUnload);
            handleDeepChange(`unloadStatus.${stage}`, true);
            toast.success(`${t('Ingredients for')} ${stageName} ${t('have been unloaded')}.`);
        } else {
            toast.info(`${t('No ingredients with lot numbers to unload for')} ${stageName}.`);
        }
    };

    const handleLoadToWarehouse = () => {
        const finishedGoodsLocation = locations.find(l => l.name.includes('Finished Goods'));
        if (!finishedGoodsLocation) {
            toast.error("Finished Goods warehouse location not found. Please configure it in Settings.");
            return;
        }

        const itemsToLoad = currentBatch.packagingLog.packagedItems
            .filter(item => item.quantityGood && item.quantityGood > 0)
            .map(item => ({
                masterItemId: item.masterItemId, lotNumber: currentBatch.lot, quantity: item.quantityGood!,
                locationId: finishedGoodsLocation.id, expiryDate: currentBatch.packagingLog.bestBeforeDate || '',
                documentNumber: `PKG-${currentBatch.lot}`,
                arrivalDate: currentBatch.packagingLog.packagingDate || new Date().toISOString().split('T')[0],
            }));
        
        if (itemsToLoad.length > 0) {
            onLoadFinishedGoods(itemsToLoad);
            handleDeepChange('packagingLog.packagingLoadedToWarehouse', true);
        } else {
            toast.info("No packaged items with a quantity greater than 0 to load.");
        }
    };

    const calculateDuration = (start?: string, end?: string): number | null => {
        if (!start || !end) return null;

        const parseTime = (timeStr: string): Date | null => {
            if (timeStr.includes('T')) {
                const date = new Date(timeStr);
                return isNaN(date.getTime()) ? null : date;
            }
            if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
                const today = new Date().toISOString().split('T')[0];
                const date = new Date(`${today}T${timeStr}`);
                return isNaN(date.getTime()) ? null : date;
            }
            return null;
        };

        const startDate = parseTime(start);
        let endDate = parseTime(end);

        if (!startDate || !endDate) return null;
        
        if (!start.includes('T') && !end.includes('T') && endDate <= startDate) {
             endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        }

        if (endDate <= startDate) return null;

        const diffMs = endDate.getTime() - startDate.getTime();
        return diffMs / (1000 * 60);
    };

    const formatValueForTimeInput = (value?: string): string => {
        if (!value) return '';
        if (value.includes('T')) {
            const parts = value.split('T');
            if (parts.length > 1) {
                return parts[1].substring(0, 5);
            }
        }
        return value;
    };

    const tabs = [
        { name: 'Mash', icon: <MashTunIcon className="w-5 h-5"/> },
        { name: 'Lauter', icon: <DropletIcon className="w-5 h-5"/> },
        { name: 'Boil', icon: <ThermometerIcon className="w-5 h-5"/> },
        { name: 'Fermentation', icon: <YeastIcon className="w-5 h-5"/> },
        { name: 'BrewStep_Packaging', icon: <BottleIcon className="w-5 h-5"/> }
    ];
    
    const packagingSummary = useMemo(() => {
        const summary = { litersInCans: 0, litersInKegs: 0, litersInBottles: 0, totalPackagedLiters: 0 };
        const cansId = categories.find(c => c.name === 'Cans')?.id;
        const kegsId = categories.find(c => c.name === 'Kegs')?.id;
        const bottlesId = categories.find(c => c.name === 'Bottles')?.id;
        
        currentBatch.packagingLog.packagedItems.forEach(item => {
            const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
            if (!masterItem) return;
            const itemLiters = (item.quantityGood || 0) * (masterItem.containerVolumeL || 0);
            if (masterItem.categoryId === cansId) summary.litersInCans += itemLiters;
            else if (masterItem.categoryId === kegsId) summary.litersInKegs += itemLiters;
            else if (masterItem.categoryId === bottlesId) summary.litersInBottles += itemLiters;
        });
        
        summary.totalPackagedLiters = summary.litersInCans + summary.litersInKegs + summary.litersInBottles;
        const summaryExpectedLiters = currentBatch.packagingLog.summaryExpectedLiters || 0;
        const canPercentage = summary.totalPackagedLiters > 0 ? (summary.litersInCans / summary.totalPackagedLiters) * 100 : 0;
        const kegPercentage = summary.totalPackagedLiters > 0 ? (summary.litersInKegs / summary.totalPackagedLiters) * 100 : 0;
        const totalLoss = summaryExpectedLiters - summary.totalPackagedLiters;
        const totalYield = summaryExpectedLiters > 0 ? (summary.totalPackagedLiters / summaryExpectedLiters) * 100 : 0;

        return { ...summary, canPercentage, kegPercentage, totalLoss, totalYield };
    }, [currentBatch.packagingLog, masterItems, categories]);

    const ActualInput: React.FC<{
        label: string;
        expectedValue: string | number | undefined;
        expectedUnit?: string;
        calculatedDuration?: number | null;
        children: React.ReactNode;
    }> = ({ label, expectedValue, expectedUnit, children, calculatedDuration }) => (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">{label}</label>
            {children}
            <div className="flex justify-between items-center mt-1 text-xs">
                {expectedValue !== undefined && expectedValue !== null && (
                    <p className="text-gray-500">{t('Expected')}: <span className="font-semibold">{expectedValue} {expectedUnit}</span></p>
                )}
                {calculatedDuration !== undefined && (
                     <p className="text-color-secondary font-semibold">
                        {t('Calculated Duration')}: {calculatedDuration !== null ? `${calculatedDuration.toFixed(0)} min` : 'N/A'}
                     </p>
                )}
            </div>
        </div>
    );

    const coolingWashingLiters = useMemo(() => {
        const start = currentBatch.boilLog.actual.coolingWashingCounterStart;
        const end = currentBatch.boilLog.actual.coolingWashingCounterEnd;
        if (typeof start === 'number' && typeof end === 'number' && end >= start) {
            return end - start;
        }
        return 0;
    }, [currentBatch.boilLog.actual.coolingWashingCounterStart, currentBatch.boilLog.actual.coolingWashingCounterEnd]);
    
    const coolingWortLiters = useMemo(() => {
        const start = currentBatch.boilLog.actual.coolingWortCounterStart;
        const end = currentBatch.boilLog.actual.coolingWortCounterEnd;
        if (typeof start === 'number' && typeof end === 'number' && end >= start) {
            return end - start;
        }
        return 0;
    }, [currentBatch.boilLog.actual.coolingWortCounterStart, currentBatch.boilLog.actual.coolingWortCounterEnd]);

    return (
        <div className="h-full flex flex-col">
            <StatusWizardModal 
                isOpen={isStatusWizardOpen}
                onClose={() => setIsStatusWizardOpen(false)}
                batch={currentBatch}
                onConfirm={handleStatusUpdate}
                t={t}
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
                    <div className="w-full sm:w-48">
                        <label className="mb-1 block text-sm font-medium text-gray-500">{t('Current Status')}</label>
                        <button 
                            type="button"
                            onClick={() => setIsStatusWizardOpen(true)}
                            disabled={currentBatch.status === 'Completed'}
                            className="w-full flex items-center justify-between space-x-2 bg-color-surface border border-color-border rounded-md py-2 px-3 text-color-text font-bold text-left hover:border-color-accent disabled:cursor-not-allowed disabled:bg-color-background"
                        >
                            <span>{t(currentBatch.status)}</span>
                            {currentBatch.status !== 'Completed' && <ArrowRightIcon className="w-5 h-5 text-color-accent"/>}
                        </button>
                    </div>
                    <button onClick={handleSave} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 w-full sm:w-auto self-end h-[42px]">
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
                    <div className="space-y-6">
                        <Card title={t('Water Profile')} icon={<WrenchIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ActualInput label={t('Mash Water (Mains, L)')} expectedValue={currentBatch.mashLog.expected.mashWaterMainsL} expectedUnit="L">
                                    <Input type="number" step="any" value={currentBatch.mashLog.actual.mashWaterMainsL ?? ''} onChange={e => handleDeepChange('mashLog.actual.mashWaterMainsL', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Mash Water (Mains, µS/cm)')} expectedValue={currentBatch.mashLog.expected.mashWaterMainsMicroSiemens} expectedUnit="µS/cm">
                                    <Input type="number" step="any" value={currentBatch.mashLog.actual.mashWaterMainsMicroSiemens ?? ''} onChange={e => handleDeepChange('mashLog.actual.mashWaterMainsMicroSiemens', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Mash Water (RO, L)')} expectedValue={currentBatch.mashLog.expected.mashWaterRoL} expectedUnit="L">
                                    <Input type="number" step="any" value={currentBatch.mashLog.actual.mashWaterRoL ?? ''} onChange={e => handleDeepChange('mashLog.actual.mashWaterRoL', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Mash Water (RO, µS/cm)')} expectedValue={currentBatch.mashLog.expected.mashWaterRoMicroSiemens} expectedUnit="µS/cm">
                                    <Input type="number" step="any" value={currentBatch.mashLog.actual.mashWaterRoMicroSiemens ?? ''} onChange={e => handleDeepChange('mashLog.actual.mashWaterRoMicroSiemens', parseNumeric(e.target.value))} />
                                </ActualInput>
                            </div>
                        </Card>
                         <Card title={t('Grist & Mash')} icon={<WrenchIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ActualInput label={t('Malt Milling (%)')} expectedValue={currentBatch.mashLog.expected.maltMilling} expectedUnit="%">
                                    <Input 
                                        type="number" 
                                        step="any" 
                                        value={currentBatch.mashLog.actual.maltMilling ?? ''} 
                                        onChange={e => handleDeepChange('mashLog.actual.maltMilling', parseNumeric(e.target.value))} 
                                    />
                                </ActualInput>
                                <ActualInput label={t('Actual Mash pH')} expectedValue={currentBatch.mashLog.expected.mashPh}>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={currentBatch.mashLog.actual.mashPh ?? ''} 
                                        onChange={e => handleDeepChange('mashLog.actual.mashPh', parseNumeric(e.target.value))} 
                                    />
                                </ActualInput>
                                <ActualInput label={t('Actual Iodine Time (min)')} expectedValue={currentBatch.mashLog.expected.expectedIodineTime} expectedUnit="min">
                                    <Input 
                                        type="number" 
                                        value={currentBatch.mashLog.actual.iodineTime ?? ''} 
                                        onChange={e => handleDeepChange('mashLog.actual.iodineTime', parseNumeric(e.target.value))} 
                                    />
                                </ActualInput>
                            </div>
                        </Card>
                        <Card title={t('Mash Steps')}>
                            <div className="space-y-4">
                                {currentBatch.mashLog.actual.steps.map((step, index) => {
                                    const expectedStep = currentBatch.mashLog.expected.steps[index];
                                    const actualDuration = calculateDuration(step.actualStartTime, step.actualEndTime);
                                    return (
                                        <div key={step.id} className="bg-color-background/60 p-3 rounded-lg border border-color-border/30">
                                            <div className="flex justify-between items-center mb-2 flex-wrap">
                                                <div className="font-bold text-color-secondary">{t(expectedStep.type)}</div>
                                                <div className="text-sm text-gray-500">
                                                    {t('Expected')}: {expectedStep.temperature}°C for {expectedStep.duration} min
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                <ActualInput label={t('Actual Temperature (°C)')} expectedValue={expectedStep.temperature} expectedUnit="°C">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={step.actualTemperature ?? ''}
                                                        onChange={e => {
                                                            const newSteps = [...currentBatch.mashLog.actual.steps];
                                                            newSteps[index].actualTemperature = parseNumeric(e.target.value);
                                                            handleDeepChange('mashLog.actual.steps', newSteps);
                                                        }}
                                                    />
                                                </ActualInput>
                                                <div className="md:col-span-2">
                                                    <ActualInput 
                                                        label={t('Actual Duration')} 
                                                        expectedValue={expectedStep.duration} 
                                                        expectedUnit="min"
                                                        calculatedDuration={actualDuration}
                                                    >
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Input
                                                                type="time"
                                                                value={formatValueForTimeInput(step.actualStartTime)}
                                                                onChange={e => {
                                                                    const newSteps = [...currentBatch.mashLog.actual.steps];
                                                                    newSteps[index].actualStartTime = e.target.value;
                                                                    handleDeepChange('mashLog.actual.steps', newSteps);
                                                                }}
                                                                showTimeNowButton
                                                            />
                                                            <Input
                                                                type="time"
                                                                value={formatValueForTimeInput(step.actualEndTime)}
                                                                onChange={e => {
                                                                    const newSteps = [...currentBatch.mashLog.actual.steps];
                                                                    newSteps[index].actualEndTime = e.target.value;
                                                                    handleDeepChange('mashLog.actual.steps', newSteps);
                                                                }}
                                                                showTimeNowButton
                                                            />
                                                        </div>
                                                    </ActualInput>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                        <Card title={t('Ingredients')}>
                            <div className="flex justify-end mb-2">
                                <button
                                    type="button"
                                    onClick={() => handleUnloadForStage('mash')}
                                    disabled={currentBatch.unloadStatus.mash || !areAllQuantitiesAssigned('mash')}
                                    className="bg-color-secondary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                                >
                                    {currentBatch.unloadStatus.mash ? t('Ingredients Unloaded') : t('Unload Ingredients')}
                                </button>
                            </div>
                            <LotAssignmentManager
                                ingredients={currentBatch.mashLog.actual.ingredients}
                                expectedIngredients={currentBatch.mashLog.expected.ingredients}
                                masterItems={masterItems}
                                warehouseItems={warehouseItems}
                                onUpdate={(updated) => handleDeepChange('mashLog.actual.ingredients', updated)}
                                t={t}
                            />
                        </Card>
                    </div>
                )}
                {activeTab === 'Lauter' && (
                    <div className="space-y-6">
                        <Card title={t('Lauter Parameters')} icon={<DropletIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <ActualInput label={t('Transfer')} expectedValue={currentBatch.lauterLog.expected.transferDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.lauterLog.actual.transferStartTime, currentBatch.lauterLog.actual.transferEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.lauterLog.actual.transferStartTime)} onChange={e => handleDeepChange('lauterLog.actual.transferStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.lauterLog.actual.transferEndTime)} onChange={e => handleDeepChange('lauterLog.actual.transferEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                                <ActualInput label={t('Recirculation')} expectedValue={currentBatch.lauterLog.expected.recirculationDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.lauterLog.actual.recirculationStartTime, currentBatch.lauterLog.actual.recirculationEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.lauterLog.actual.recirculationStartTime)} onChange={e => handleDeepChange('lauterLog.actual.recirculationStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.lauterLog.actual.recirculationEndTime)} onChange={e => handleDeepChange('lauterLog.actual.recirculationEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                                <ActualInput label={t('Filtration')} expectedValue={currentBatch.lauterLog.expected.filtrationDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.lauterLog.actual.filtrationStartTime, currentBatch.lauterLog.actual.filtrationEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.lauterLog.actual.filtrationStartTime)} onChange={e => handleDeepChange('lauterLog.actual.filtrationStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.lauterLog.actual.filtrationEndTime)} onChange={e => handleDeepChange('lauterLog.actual.filtrationEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                                <ActualInput label={t('First Wort (°P)')} expectedValue={currentBatch.lauterLog.expected.firstWortPlato} expectedUnit="°P">
                                    <Input type="number" step="0.1" value={currentBatch.lauterLog.actual.firstWortPlato ?? ''} onChange={e => handleDeepChange('lauterLog.actual.firstWortPlato', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('First Wort pH')} expectedValue={currentBatch.lauterLog.expected.firstWortPh}>
                                    <Input type="number" step="0.01" value={currentBatch.lauterLog.actual.firstWortPh ?? ''} onChange={e => handleDeepChange('lauterLog.actual.firstWortPh', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Last Wort (°P)')} expectedValue={currentBatch.lauterLog.expected.lastWortPlato} expectedUnit="°P">
                                    <Input type="number" step="0.1" value={currentBatch.lauterLog.actual.lastWortPlato ?? ''} onChange={e => handleDeepChange('lauterLog.actual.lastWortPlato', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Last Wort pH')} expectedValue={currentBatch.lauterLog.expected.lastWortPh}>
                                    <Input type="number" step="0.01" value={currentBatch.lauterLog.actual.lastWortPh ?? ''} onChange={e => handleDeepChange('lauterLog.actual.lastWortPh', parseNumeric(e.target.value))} />
                                </ActualInput>
                            </div>
                        </Card>
                        <Card title={t('Sparge Water (L)')} icon={<WrenchIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ActualInput label={t('Sparge Water (L)')} expectedValue={currentBatch.lauterLog.expected.spargeWaterL} expectedUnit="L">
                                    <Input type="number" step="any" value={currentBatch.lauterLog.actual.spargeWaterL ?? ''} onChange={e => handleDeepChange('lauterLog.actual.spargeWaterL', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Sparge Water (µS/cm)')} expectedValue={currentBatch.lauterLog.expected.spargeWaterMicroSiemens} expectedUnit="µS/cm">
                                    <Input type="number" step="any" value={currentBatch.lauterLog.actual.spargeWaterMicroSiemens ?? ''} onChange={e => handleDeepChange('lauterLog.actual.spargeWaterMicroSiemens', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Sparge Water pH')} expectedValue={currentBatch.lauterLog.expected.spargeWaterPh}>
                                    <Input type="number" step="0.01" value={currentBatch.lauterLog.actual.spargeWaterPh ?? ''} onChange={e => handleDeepChange('lauterLog.actual.spargeWaterPh', parseNumeric(e.target.value))} />
                                </ActualInput>
                            </div>
                        </Card>
                    </div>
                )}
                {activeTab === 'Boil' && (
                    <div className="space-y-6">
                        <Card title={t('Boil Parameters')} icon={<ThermometerIcon className="w-5 h-5"/>}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                <ActualInput label={t('Pre-Boil Liters')} expectedValue={currentBatch.boilLog.expected.preBoilLiters} expectedUnit="L">
                                    <Input type="number" step="any" value={currentBatch.boilLog.actual.preBoilLiters ?? ''} onChange={e => handleDeepChange('boilLog.actual.preBoilLiters', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Pre-Boil Plato')} expectedValue={currentBatch.boilLog.expected.preBoilPlato} expectedUnit="°P">
                                    <Input type="number" step="0.1" value={currentBatch.boilLog.actual.preBoilPlato ?? ''} onChange={e => handleDeepChange('boilLog.actual.preBoilPlato', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Pre-boil pH')} expectedValue={currentBatch.boilLog.expected.preBoilPh}>
                                    <Input type="number" step="0.01" value={currentBatch.boilLog.actual.preBoilPh ?? ''} onChange={e => handleDeepChange('boilLog.actual.preBoilPh', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Post-Boil Liters')} expectedValue={currentBatch.boilLog.expected.postBoilLiters} expectedUnit="L">
                                    <Input type="number" step="any" value={currentBatch.boilLog.actual.postBoilLiters ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilLiters', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Post-Boil Plato')} expectedValue={currentBatch.boilLog.expected.postBoilPlato} expectedUnit="°P">
                                    <Input type="number" step="0.1" value={currentBatch.boilLog.actual.postBoilPlato ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilPlato', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput label={t('Post-Boil pH')} expectedValue={currentBatch.boilLog.expected.postBoilPh}>
                                    <Input type="number" step="0.01" value={currentBatch.boilLog.actual.postBoilPh ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilPh', parseNumeric(e.target.value))} />
                                </ActualInput>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                                <ActualInput label={t('Boil')} expectedValue={currentBatch.boilLog.expected.boilDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.boilLog.actual.boilStartTime, currentBatch.boilLog.actual.boilEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.boilStartTime)} onChange={e => handleDeepChange('boilLog.actual.boilStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.boilEndTime)} onChange={e => handleDeepChange('boilLog.actual.boilEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                                <ActualInput label={t('Whirlpool')} expectedValue={currentBatch.boilLog.expected.whirlpoolDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.boilLog.actual.whirlpoolStartTime, currentBatch.boilLog.actual.whirlpoolEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.whirlpoolStartTime)} onChange={e => handleDeepChange('boilLog.actual.whirlpoolStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.whirlpoolEndTime)} onChange={e => handleDeepChange('boilLog.actual.whirlpoolEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                                <ActualInput label={t('Whirlpool Rest')} expectedValue={currentBatch.boilLog.expected.whirlpoolRestDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.boilLog.actual.whirlpoolRestStartTime, currentBatch.boilLog.actual.whirlpoolRestEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.whirlpoolRestStartTime)} onChange={e => handleDeepChange('boilLog.actual.whirlpoolRestStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.whirlpoolRestEndTime)} onChange={e => handleDeepChange('boilLog.actual.whirlpoolRestEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                                <ActualInput label={t('Cooling')} expectedValue={currentBatch.boilLog.expected.coolingDuration} expectedUnit="min" calculatedDuration={calculateDuration(currentBatch.boilLog.actual.coolingStartTime, currentBatch.boilLog.actual.coolingEndTime)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.coolingStartTime)} onChange={e => handleDeepChange('boilLog.actual.coolingStartTime', e.target.value)} />
                                        <Input type="time" showTimeNowButton value={formatValueForTimeInput(currentBatch.boilLog.actual.coolingEndTime)} onChange={e => handleDeepChange('boilLog.actual.coolingEndTime', e.target.value)} />
                                    </div>
                                </ActualInput>
                            </div>
                        </Card>
                        <Card title={t('LiterCounterReadings')}>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-color-border/30">
                                        <th className="py-2"></th>
                                        <th className="py-2 text-center">{t('Start')}</th>
                                        <th className="py-2 text-center">{t('End')}</th>
                                        <th className="py-2 text-center">{t('Liters')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-2 font-semibold">{t('WashingLiterCounter')}</td>
                                        <td><Input type="number" step="any" value={currentBatch.boilLog.actual.coolingWashingCounterStart ?? ''} onChange={e => handleDeepChange('boilLog.actual.coolingWashingCounterStart', parseNumeric(e.target.value))} className="text-center" /></td>
                                        <td><Input type="number" step="any" value={currentBatch.boilLog.actual.coolingWashingCounterEnd ?? ''} onChange={e => handleDeepChange('boilLog.actual.coolingWashingCounterEnd', parseNumeric(e.target.value))} className="text-center" /></td>
                                        <td className="py-2 text-center font-bold font-mono text-color-accent">{coolingWashingLiters.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-semibold">{t('WortLiterCounter')}</td>
                                        <td><Input type="number" step="any" value={currentBatch.boilLog.actual.coolingWortCounterStart ?? ''} onChange={e => handleDeepChange('boilLog.actual.coolingWortCounterStart', parseNumeric(e.target.value))} className="text-center" /></td>
                                        <td><Input type="number" step="any" value={currentBatch.boilLog.actual.coolingWortCounterEnd ?? ''} onChange={e => handleDeepChange('boilLog.actual.coolingWortCounterEnd', parseNumeric(e.target.value))} className="text-center" /></td>
                                        <td className="py-2 text-center font-bold font-mono text-color-accent">{coolingWortLiters.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card>
                        <Card title={t('Ingredients')}>
                            <div className="flex justify-end mb-2">
                                <button type="button" onClick={() => handleUnloadForStage('boil')} disabled={currentBatch.unloadStatus.boil || !areAllQuantitiesAssigned('boil')} className="bg-color-secondary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors">
                                    {currentBatch.unloadStatus.boil ? t('Ingredients Unloaded') : t('Unload Ingredients')}
                                </button>
                            </div>
                            <LotAssignmentManager ingredients={currentBatch.boilLog.actual.ingredients as ActualIngredient[]} expectedIngredients={currentBatch.boilLog.expected.ingredients as Ingredient[]} masterItems={masterItems} warehouseItems={warehouseItems} onUpdate={(updated) => handleDeepChange('boilLog.actual.ingredients', updated)} t={t} />
                        </Card>
                    </div>
                )}
                {activeTab === 'Fermentation' && (
                    <div className="space-y-6">
                        <Card title={t('Expected Steps')} icon={<YeastIcon className="w-5 h-5"/>}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className="border-b-2 border-color-border/50">
                                        <th className="p-2">{t('Step Description')}</th>
                                        <th className="p-2 text-right">{t('Temperature (°C)')}</th>
                                        <th className="p-2 text-right">{t('Pressure (Bar)')}</th>
                                        <th className="p-2 text-right">{t('Days')}</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-color-border/20">
                                    {currentBatch.fermentationLog.expected.steps.map(step => (
                                        <tr key={step.id}>
                                            <td className="p-2">{step.description}</td>
                                            <td className="p-2 text-right font-mono">{step.temperature}</td>
                                            <td className="p-2 text-right font-mono">{step.pressure}</td>
                                            <td className="p-2 text-right font-mono">{step.days}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                        <Card title={t('Additions')}>
                            <div className="flex justify-end mb-2">
                                <button type="button" onClick={() => handleUnloadForStage('fermentation')} disabled={currentBatch.unloadStatus.fermentation || !areAllQuantitiesAssigned('fermentation')} className="bg-color-secondary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors">
                                    {currentBatch.unloadStatus.fermentation ? t('Ingredients Unloaded') : t('Unload Ingredients')}
                                </button>
                            </div>
                            <LotAssignmentManager ingredients={currentBatch.fermentationLog.actual.additions as ActualIngredient[]} expectedIngredients={currentBatch.fermentationLog.expected.additions as Ingredient[]} masterItems={masterItems} warehouseItems={warehouseItems} onUpdate={(updated) => handleDeepChange('fermentationLog.actual.additions', updated)} t={t} />
                        </Card>
                        <Card title={t('Fermentation Log')}>
                            {currentBatch.fermentationLog.actual.logEntries.map((entry, index) => (
                                <div key={entry.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center mb-2 bg-color-background p-2 rounded-md">
                                    <Input type="datetime-local" value={entry.timestamp.substring(0, 16)} onChange={e => handleLogChange(index, 'timestamp', new Date(e.target.value).toISOString())} showTimeNowButton />
                                    <Input type="number" step="0.1" unit="°P" placeholder={t('Gravity (°P)')} value={entry.gravity} onChange={e => handleLogChange(index, 'gravity', parseFloat(e.target.value))} />
                                    <Input type="number" step="0.01" unit="pH" placeholder={t('pH')} value={entry.ph} onChange={e => handleLogChange(index, 'ph', parseFloat(e.target.value))} />
                                    <Input placeholder={t('Notes')} value={entry.notes} onChange={e => handleLogChange(index, 'notes', e.target.value)} />
                                    <button onClick={() => removeLogEntry(index)} className="p-2 text-red-500 hover:text-red-400 justify-self-end"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                            <button onClick={addLogEntry} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                                <PlusCircleIcon className="w-5 h-5"/><span>{t('Add Log Entry')}</span>
                            </button>
                        </Card>
                    </div>
                )}
                {activeTab === 'BrewStep_Packaging' && (
                    <div className="space-y-6">
                        <Card>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label={t('Packaging Date')} type="date" value={currentBatch.packagingLog.packagingDate ?? ''} onChange={e => handleDeepChange('packagingLog.packagingDate', e.target.value)} />
                                <Input label={t('Best Before Date')} type="date" value={currentBatch.packagingLog.bestBeforeDate ?? ''} onChange={e => handleDeepChange('packagingLog.bestBeforeDate', e.target.value)} />
                                <Input label={t('Tank pressure')} type="number" step="0.1" value={currentBatch.packagingLog.tankPressure ?? ''} onChange={e => handleDeepChange('packagingLog.tankPressure', parseNumeric(e.target.value))} unit="Bar" />
                                <Input label={t('Saturation pressure and time')} value={currentBatch.packagingLog.saturation ?? ''} onChange={e => handleDeepChange('packagingLog.saturation', e.target.value)} />
                            </div>
                        </Card>

                        <UnloadMaterialsCard masterItems={masterItems} warehouseItems={warehouseItems} categories={categories} unloadList={unloadList} onAdd={handleAddUnloadItem} onRemove={handleRemoveUnloadItem} onConfirm={handleConfirmUnload} t={t} />

                        <Card title={t('Packaged Items Log')}>
                            <div className="flex justify-end mb-2">
                                <button
                                    type="button"
                                    onClick={handleLoadToWarehouse}
                                    disabled={currentBatch.packagingLog.packagingLoadedToWarehouse}
                                    className="bg-color-secondary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                                >
                                    {currentBatch.packagingLog.packagingLoadedToWarehouse ? t('Loaded to Warehouse') : t('Load to Warehouse')}
                                </button>
                            </div>
                            <div className="space-y-4">
                            {currentBatch.packagingLog.packagedItems.map((item, index) => {
                                const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                                const totalLiters = (item.quantityGood || 0) * (masterItem?.containerVolumeL || 0);
                                return (
                                    <div key={item.id} className="bg-color-background/50 p-3 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                            <div className="md:col-span-2">
                                                <label className="font-semibold">{masterItem ? masterItem.name : t('Unknown Item')}</label>
                                                <p className="text-xs text-gray-500">{t('Container Volume')}: {masterItem?.containerVolumeL || 'N/A'} L</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-color-accent">{totalLiters.toFixed(2)} L</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2">
                                            <Input label={t('Quantity Good')} type="number" value={item.quantityGood || ''} onChange={e => handleDeepChange(`packagingLog.packagedItems.${index}.quantityGood`, parseNumeric(e.target.value))} unit={masterItem?.unit} />
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
                        </Card>
                        
                        <Card title={t('Summary')}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div><p className="text-sm text-gray-500">{t('Packaged Liters (lt)')}</p><p className="text-xl font-bold">{packagingSummary.totalPackagedLiters.toFixed(2)}</p></div>
                                <div><p className="text-sm text-gray-500">{t('Can Percentage (%)')}</p><p className="text-xl font-bold">{packagingSummary.canPercentage.toFixed(1)}</p></div>
                                <div><p className="text-sm text-gray-500">{t('Keg Percentage (%)')}</p><p className="text-xl font-bold">{packagingSummary.kegPercentage.toFixed(1)}</p></div>
                                <div><p className="text-sm text-gray-500">{t('Total Loss (lt)')}</p><p className="text-xl font-bold">{packagingSummary.totalLoss.toFixed(2)}</p></div>
                                <div className="col-span-full mt-2"><p className="text-sm text-gray-500">{t('Packaging_Yield_Percent')}</p><p className="text-2xl font-bold text-color-accent">{packagingSummary.totalYield.toFixed(1)}%</p></div>
                            </div>
                            <div className="mt-4">
                                <label className="mb-1 block text-sm font-medium text-gray-500">{t('Notes')}</label>
                                <textarea value={currentBatch.packagingLog.notes || ''} onChange={e => handleDeepChange('packagingLog.notes', e.target.value)} rows={3} className="w-full bg-color-background border border-color-border rounded-md p-2" placeholder={t('Enter any packaging notes here...')}></textarea>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrewSheetPage;
