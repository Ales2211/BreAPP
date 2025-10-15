

import React, { useState, useMemo, useEffect } from 'react';
// FIX: Added BoilWhirlpoolIngredient and TankIngredient to imports to fix casting errors.
import { BrewSheet, LogEntry, MasterItem, WarehouseItem, ActualIngredient, ActualBoilWhirlpoolIngredient, ActualTankIngredient, Category, Unit, PackagedItemActual, Recipe, Location, LotAssignment, Ingredient, MashStep, BoilWhirlpoolIngredient, TankIngredient, Page, QualityControlValueSpec, FermentationStep } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, MashTunIcon, DropletIcon, ThermometerIcon, YeastIcon, BottleIcon, DownloadIcon, ArrowRightIcon, WrenchIcon, LinkIcon, ArrowRightLeftIcon, ChartBarIcon, HopsIcon, SnowflakeIcon, PencilIcon, ClipboardListIcon, CheckCircleIcon, AlertTriangleIcon } from '../components/Icons';
import TransferBatchModal from '../components/TransferBatchModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BrewSheetPageProps {
  batch: BrewSheet;
  allBatches: BrewSheet[];
  recipes: Recipe[];
  masterItems: MasterItem[];
  warehouseItems: WarehouseItem[];
  categories: Category[];
  locations: Location[];
  onBack: () => void;
  onSave: (batch: BrewSheet) => void;
  onUnloadItems: (items: Omit<WarehouseItem, 'id'>[]) => void;
  onLoadFinishedGoods: (items: Omit<WarehouseItem, 'id'>[]) => void;
  onNavigate: (page: { page: Page, id: string }) => void;
  onTransferBatch: (batchId: string, newFermenterId: string, transferDate: string) => void;
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
        if (!parent) return [];

        const childIds = categories
            .filter(c => c.parentCategoryId === parent.id)
            .map(c => c.id);

        return [parent.id, ...childIds];
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

        newIngredients[ingIndex].lotAssignments.push({ id: generateUniqueId('lot'), lotNumber: '', quantity: undefined });
        onUpdate(newIngredients);
    };

    const removeLotAssignment = (ingId: string, assignIndex: number) => {
        const newIngredients = [...ingredients];
        const ingIndex = newIngredients.findIndex(i => i.id === ingId);
        if (ingIndex === -1) return;

        newIngredients[ingIndex].lotAssignments = newIngredients[ingIndex].lotAssignments.filter((_, i) => i !== assignIndex);
        onUpdate(newIngredients);
    };

    const parseValue = (value: string) => value === '' ? undefined : parseFloat(value);

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
                        <div className="flex justify-between items-start mb-2 flex-wrap gap-y-1">
                            <div className="flex-1 min-w-0 pr-4">
                                <h5 className="font-bold text-md text-color-text truncate">{masterItem.name}</h5>
                                <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
                                    {('type' in expectedIng && 'timing' in expectedIng) && (
                                        <>
                                            <span className="font-medium">{t('Phase')}: <span className="font-semibold text-color-text">{t((expectedIng as BoilWhirlpoolIngredient).type)}</span></span>
                                            <span className="font-medium">{t('Timing')}: <span className="font-semibold text-color-text">{(expectedIng as BoilWhirlpoolIngredient).timing} min</span></span>
                                            {(expectedIng as BoilWhirlpoolIngredient).temperature !== undefined && (
                                                <span className="font-medium">{t('Temp.')}: <span className="font-semibold text-color-text">{(expectedIng as BoilWhirlpoolIngredient).temperature}°C</span></span>
                                            )}
                                        </>
                                    )}
                                    {('day' in expectedIng) && (
                                        <span className="font-medium">{t('Day')}: <span className="font-semibold text-color-text">{(expectedIng as TankIngredient).day}</span></span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className={`text-sm font-semibold ${isComplete ? 'text-green-500' : 'text-orange-500'}`}>
                                    <p><span className="font-mono">{totalAssigned.toFixed(2)} / {expectedIng.quantity.toFixed(2)}</span> {masterItem.unit}</p>
                                </div>
                                <p className="text-xs text-gray-500">{t('Expected')}: {expectedIng.quantity.toFixed(2)} {masterItem.unit} {sackCount ? `/ ≈ ${sackCount} ${t('sacks')}` : ''}</p>
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
                                            value={assignment.quantity ?? ''}
                                            onChange={e => handleLotAssignmentChange(actualIng.id, assignIndex, 'quantity', parseValue(e.target.value))}
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


const BrewSheetPage: React.FC<BrewSheetPageProps> = ({ batch, allBatches, recipes, masterItems, warehouseItems, categories, locations, onBack, onSave, onUnloadItems, onLoadFinishedGoods, onNavigate, onTransferBatch }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [currentBatch, setCurrentBatch] = useState<BrewSheet>(batch);
    const [activeTab, setActiveTab] = useState('Mash');
    const [unloadList, setUnloadList] = useState<UnloadItem[]>([]);
    const [isStatusWizardOpen, setIsStatusWizardOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    
    useEffect(() => {
        setCurrentBatch(batch);
    }, [batch]);

    const recipe = useMemo(() => recipes.find(r => r.id === batch.recipeId), [batch.recipeId, recipes]);
    const fermenterName = useMemo(() => locations.find(l => l.id === currentBatch.fermenterId)?.name || t('N/A'), [currentBatch.fermenterId, locations, t]);


    const { childBatches, parentBatch } = useMemo(() => {
        const children = allBatches.filter(b => b.linkedBatchId === batch.id);
        const parent = batch.linkedBatchId ? allBatches.find(b => b.id === batch.linkedBatchId) : null;
        return { childBatches: children, parentBatch: parent };
    }, [batch, allBatches]);
    
    const totalExpectedLiters = useMemo(() => {
        if (childBatches.length > 0) {
            const baseLiters = recipe?.qualityControlSpec.liters.target || 0;
            return childBatches.reduce((sum, child) => {
                const childRecipe = recipes.find(r => r.id === child.recipeId);
                return sum + (childRecipe?.qualityControlSpec.liters.target || 0);
            }, baseLiters);
        }
        return recipe?.qualityControlSpec.liters.target || 0;
    }, [recipe, childBatches, recipes]);

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
    
    useEffect(() => {
        const newExpectedLiters = totalExpectedLiters * ((recipe?.processParameters.packagingYield || 0) / 100);
        if (newExpectedLiters > 0 && newExpectedLiters !== currentBatch.packagingLog.summaryExpectedLiters) {
            handleDeepChange('packagingLog.summaryExpectedLiters', newExpectedLiters);
        }
    }, [totalExpectedLiters, recipe, currentBatch.packagingLog.summaryExpectedLiters]);


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
    
    const handleUnloadForStage = (stage: 'mash' | 'boil') => {
        const ingredients = stage === 'mash' ? currentBatch.mashLog.actual.ingredients : currentBatch.boilLog.actual.ingredients;
        const stageName = stage === 'mash' ? t('Mash') : t('Boil');

        const itemsToUnload = ingredients
            .flatMap(ing => ing.lotAssignments.map(assignment => ({
                masterItemId: ing.masterItemId, lotNumber: assignment.lotNumber, quantity: assignment.quantity,
                locationId: '', expiryDate: '', documentNumber: `BREW-${currentBatch.lot}`, arrivalDate: currentBatch.cookDate,
            })))
            .filter(item => item.quantity && item.quantity > 0 && item.lotNumber);

        if (itemsToUnload.length > 0) {
            onUnloadItems(itemsToUnload as Omit<WarehouseItem, 'id'>[]);
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

        const baseLot = currentBatch.lot.split('/')[0];

        const itemsToLoad = currentBatch.packagingLog.packagedItems
            .filter(item => item.quantityGood && item.quantityGood > 0)
            .map(item => ({
                masterItemId: item.masterItemId,
                lotNumber: baseLot,
                quantity: item.quantityGood!,
                locationId: finishedGoodsLocation.id,
                expiryDate: currentBatch.packagingLog.bestBeforeDate || '',
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

    let tabs = [
        { name: 'Mash', icon: <MashTunIcon className="w-5 h-5"/> },
        { name: 'Lauter', icon: <DropletIcon className="w-5 h-5"/> },
        { name: 'Boil', icon: <ThermometerIcon className="w-5 h-5"/> },
        { name: 'Fermentation', icon: <YeastIcon className="w-5 h-5"/> },
        { name: 'BrewStep_Packaging', icon: <BottleIcon className="w-5 h-5"/> },
        { name: 'Summary', icon: <ClipboardListIcon className="w-5 h-5"/> }
    ];

    if (parentBatch) {
        tabs = tabs.slice(0, 3); // Only Mash, Lauter, Boil for child batches
    }
    
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
        expectedMin?: number;
        expectedMax?: number;
        calculatedDuration?: number | null;
        children: React.ReactNode;
    }> = ({ label, expectedValue, expectedUnit, expectedMin, expectedMax, children, calculatedDuration }) => (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">{label}</label>
            {children}
            <div className="flex justify-between items-center mt-1 text-xs">
                {expectedValue !== undefined && expectedValue !== null && (
                    <p className="text-gray-500">
                        {t('Expected')}: <span className="font-semibold">{expectedValue} {expectedUnit}</span>
                        {(expectedMin !== undefined && expectedMax !== undefined) && (
                            <span className="ml-2 font-normal text-gray-400">[{expectedMin} - {expectedMax}]</span>
                        )}
                    </p>
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

    const allIngredientsUsed = useMemo(() => {
        const ingredients: { stage: string, item: MasterItem | undefined, lot: LotAssignment }[] = [];
        
        const addFromStage = (stageName: string, actuals: ActualIngredient[]) => {
            actuals.forEach(ing => {
                const masterItem = masterItems.find(mi => mi.id === ing.masterItemId);
                ing.lotAssignments.forEach(lot => {
                    if(lot.quantity && lot.quantity > 0 && lot.lotNumber) {
                        ingredients.push({ stage: stageName, item: masterItem, lot });
                    }
                });
            });
        };
    
        addFromStage(t('Mash'), currentBatch.mashLog.actual.ingredients);
        addFromStage(t('Boil'), currentBatch.boilLog.actual.ingredients as ActualIngredient[]);
        addFromStage(t('Fermentation'), currentBatch.fermentationLog.actual.additions as ActualIngredient[]);
        
        return ingredients;
    }, [currentBatch, masterItems, t]);
    
    const comparisonParams = useMemo(() => {
        if (!recipe) return [];
    
        const getLastLogValue = (prop: 'gravity' | 'ph'): number | undefined => {
            for (let i = currentBatch.fermentationLog.actual.logEntries.length - 1; i >= 0; i--) {
                const entry = currentBatch.fermentationLog.actual.logEntries[i];
                if (entry[prop] !== undefined && entry[prop] !== null) {
                    return entry[prop];
                }
            }
            return undefined;
        };
    
        const checkSpec = (value: number | undefined, spec: QualityControlValueSpec | undefined): boolean | null => {
            if (value === undefined || value === null || !spec || spec.min === undefined || spec.max === undefined) {
                return null;
            }
            return value >= spec.min && value <= spec.max;
        };
        
        const formatExpected = (spec: QualityControlValueSpec, unit: string, precision: number = 2) => {
            if (spec.target === undefined) return 'N/A';
            return `${spec.target.toFixed(precision)} ${unit} [${spec.min?.toFixed(precision)} - ${spec.max?.toFixed(precision)}]`;
        };
    
        const parameters = [
            { name: t('OG'), expected: formatExpected(recipe.qualityControlSpec.og, '°P'), actual: currentBatch.boilLog.actual.postBoilPlato, unit: '°P', precision: 2, inSpec: checkSpec(currentBatch.boilLog.actual.postBoilPlato, recipe.qualityControlSpec.og) },
            { name: t('Final Gravity'), expected: formatExpected(recipe.qualityControlSpec.fg, '°P'), actual: getLastLogValue('gravity'), unit: '°P', precision: 2, inSpec: checkSpec(getLastLogValue('gravity'), recipe.qualityControlSpec.fg) },
            { name: t('Final Volume'), expected: formatExpected(recipe.qualityControlSpec.liters, 'L', 0), actual: coolingWortLiters, unit: 'L', precision: 0, inSpec: checkSpec(coolingWortLiters, recipe.qualityControlSpec.liters) },
            { name: t('Mash pH'), expected: `${recipe.processParameters.expectedMashPh?.toFixed(2)} [${(recipe.processParameters.expectedMashPh! - 0.1).toFixed(2)} - ${(recipe.processParameters.expectedMashPh! + 0.1).toFixed(2)}]`, actual: currentBatch.mashLog.actual.mashPh, unit: '', precision: 2, inSpec: checkSpec(currentBatch.mashLog.actual.mashPh, { target: recipe.processParameters.expectedMashPh, min: (recipe.processParameters.expectedMashPh || 0) - 0.1, max: (recipe.processParameters.expectedMashPh || 0) + 0.1 }) },
            { name: t('Pre-Ferm pH'), expected: formatExpected(recipe.qualityControlSpec.preFermentationPh, ''), actual: currentBatch.boilLog.actual.postBoilPh, unit: '', precision: 2, inSpec: checkSpec(currentBatch.boilLog.actual.postBoilPh, recipe.qualityControlSpec.preFermentationPh) },
            { name: t('Final pH'), expected: formatExpected(recipe.qualityControlSpec.finalPh, ''), actual: getLastLogValue('ph'), unit: '', precision: 2, inSpec: checkSpec(getLastLogValue('ph'), recipe.qualityControlSpec.finalPh) },
            { name: t('Packaging Yield'), expected: `${recipe.processParameters.packagingYield.toFixed(1)}%`, actual: packagingSummary.totalYield, unit: '%', precision: 1, inSpec: checkSpec(packagingSummary.totalYield, { target: recipe.processParameters.packagingYield, min: recipe.processParameters.packagingYield - 5, max: 100}) },
        ];
    
        return parameters;
    }, [currentBatch, recipe, t, coolingWortLiters, packagingSummary]);

    return (
        <div className="h-full flex flex-col">
            <StatusWizardModal 
                isOpen={isStatusWizardOpen}
                onClose={() => setIsStatusWizardOpen(false)}
                batch={currentBatch}
                onConfirm={handleStatusUpdate}
                t={t}
            />
            <TransferBatchModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onConfirm={onTransferBatch}
                batch={currentBatch}
                locations={locations}
                recipes={recipes}
                batches={allBatches}
            />
            {parentBatch && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
                    <p className="font-bold">{t('This is a linked batch (turn).')}</p>
                    <p>{t('Fermentation and Packaging are managed on the main batch.')}
                        <button onClick={() => onNavigate({ page: Page.Batches, id: parentBatch.id })} className="ml-2 font-semibold underline hover:text-blue-600">
                            {t('View Main Batch')} ({parentBatch.lot})
                        </button>
                    </p>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4 flex-shrink-0">
                {/* Left side: Title */}
                <div className="flex items-center min-w-0 flex-1">
                    <button type="button" onClick={onBack} className="p-1.5 mr-2 rounded-full hover:bg-color-border/50 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline flex-wrap gap-x-2">
                            <h1 className="text-base sm:text-lg font-bold text-color-text truncate">
                                {currentBatch.beerName} - {currentBatch.lot}
                            </h1>
                            <span className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">({fermenterName})</span>
                        </div>
                    </div>
                </div>
                {/* Right side: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button 
                        onClick={() => setIsTransferModalOpen(true)} 
                        disabled={!['In Progress', 'Fermenting'].includes(currentBatch.status)} 
                        className="flex items-center justify-center space-x-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1.5 px-3 rounded-lg shadow transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm"
                        title={t('Transfer Tank')}
                    >
                        <ArrowRightLeftIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('Transfer Tank')}</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsStatusWizardOpen(true)}
                        disabled={currentBatch.status === 'Completed'}
                        className="flex items-center justify-between space-x-2 w-32 sm:w-36 bg-color-surface border border-color-border rounded-lg py-1.5 px-3 text-color-text font-bold text-left hover:border-color-accent disabled:cursor-not-allowed disabled:bg-color-background text-xs sm:text-sm"
                        title={t('Change Status')}
                    >
                        <span className="truncate">{t(currentBatch.status)}</span>
                        {currentBatch.status !== 'Completed' && <ArrowRightIcon className="w-4 h-4 text-color-accent"/>}
                    </button>
                    <button onClick={handleSave} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-1.5 px-4 rounded-lg shadow transition-transform transform hover:scale-105 text-xs sm:text-sm">
                        {t('Save')}
                    </button>
                </div>
            </div>

            {childBatches.length > 0 && (
                <Card title={t('Linked Batches')} icon={<LinkIcon className="w-5 h-5"/>} className="mb-6 flex-shrink-0">
                    <ul className="divide-y divide-color-border/50">
                        {childBatches.map(child => (
                            <li key={child.id} className="py-2 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{t('Lot')}: {child.lot}</p>
                                    <p className="text-sm text-gray-500">{t('Cook Date')}: {child.cookDate}</p>
                                </div>
                                <button onClick={() => onNavigate({ page: Page.Batches, id: child.id })} className="text-sm font-semibold text-color-accent hover:underline">
                                    {t('View Turn')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
            
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
                                <ActualInput 
                                    label={t('Post-Boil Plato')} 
                                    expectedValue={currentBatch.boilLog.expected.postBoilPlato} 
                                    expectedUnit="°P"
                                    expectedMin={recipe?.qualityControlSpec.og.min}
                                    expectedMax={recipe?.qualityControlSpec.og.max}
                                >
                                    <Input type="number" step="0.1" value={currentBatch.boilLog.actual.postBoilPlato ?? ''} onChange={e => handleDeepChange('boilLog.actual.postBoilPlato', parseNumeric(e.target.value))} />
                                </ActualInput>
                                <ActualInput 
                                    label={t('Post-Boil pH')} 
                                    expectedValue={currentBatch.boilLog.expected.postBoilPh}
                                    expectedMin={recipe?.qualityControlSpec.preFermentationPh.min}
                                    expectedMax={recipe?.qualityControlSpec.preFermentationPh.max}
                                >
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
                            <div className="border-t border-color-border/30 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ActualInput 
                                    label={t('Boil Water Addition')} 
                                    expectedValue={currentBatch.boilLog.expected.boilWaterAdditionL}
                                    expectedUnit="L"
                                >
                                    <Input 
                                        type="number" 
                                        step="any" 
                                        value={currentBatch.boilLog.actual.boilWaterAdditionL ?? ''} 
                                        onChange={e => handleDeepChange('boilLog.actual.boilWaterAdditionL', parseNumeric(e.target.value))} 
                                        unit="L"
                                    />
                                </ActualInput>
                                <ActualInput 
                                    label={t('Notes')} 
                                    expectedValue={currentBatch.boilLog.expected.boilWaterAdditionNotes}
                                >
                                    <Input 
                                        value={currentBatch.boilLog.actual.boilWaterAdditionNotes ?? ''} 
                                        onChange={e => handleDeepChange('boilLog.actual.boilWaterAdditionNotes', e.target.value)} 
                                    />
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
                                        <td className="py-2 font-semibold">
                                            {t('WortLiterCounter')}
                                            <p className="text-xs text-gray-500 font-normal">
                                                {t('Expected')}: {totalExpectedLiters.toFixed(2)} L
                                                {(recipe?.qualityControlSpec.liters.min !== undefined && recipe?.qualityControlSpec.liters.max !== undefined) && (
                                                    <span className="ml-2">[{recipe.qualityControlSpec.liters.min} - {recipe.qualityControlSpec.liters.max}]</span>
                                                )}
                                            </p>
                                        </td>
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
                            <LotAssignmentManager ingredients={currentBatch.boilLog.actual.ingredients as ActualIngredient[]} expectedIngredients={currentBatch.boilLog.expected.ingredients} masterItems={masterItems} warehouseItems={warehouseItems} onUpdate={(updated) => handleDeepChange('boilLog.actual.ingredients', updated)} t={t} />
                        </Card>
                    </div>
                )}
                {activeTab === 'Fermentation' && (
                    <FermentationSection 
                        batch={currentBatch}
                        onDeepChange={handleDeepChange}
                        onSave={onSave}
                        t={t}
                        masterItems={masterItems}
                        warehouseItems={warehouseItems}
                        onUnloadItems={onUnloadItems}
                    />
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
                                            <Input label={t('Quantity Good')} type="number" value={item.quantityGood ?? ''} onChange={e => handleDeepChange(`packagingLog.packagedItems.${index}.quantityGood`, parseNumeric(e.target.value))} unit={masterItem?.unit} />
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
                {activeTab === 'Summary' && (
                    <div className="space-y-6">
                        <Card title={t('Ingredient Summary')} icon={<ClipboardListIcon className="w-5 h-5"/>}>
                            {allIngredientsUsed.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-color-border/50">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-color-background">
                                            <tr>
                                                <th className="py-2 px-3 font-semibold">{t('Stage')}</th>
                                                <th className="py-2 px-3 font-semibold">{t('Item Name')}</th>
                                                <th className="py-2 px-3 font-semibold">{t('Lot Number')}</th>
                                                <th className="py-2 px-3 font-semibold text-right">{t('Quantity')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-color-border/50">
                                            {allIngredientsUsed.map(({ stage, item, lot }, index) => (
                                                <tr key={index} className="bg-color-background/50">
                                                    <td className="py-2 px-3">{stage}</td>
                                                    <td className="py-2 px-3 font-semibold">{item?.name}</td>
                                                    <td className="py-2 px-3 font-mono">{lot.lotNumber}</td>
                                                    <td className="py-2 px-3 text-right font-mono">{lot.quantity?.toFixed(2)} {item?.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="text-gray-500 text-center py-4">{t('No ingredients with lots have been assigned yet.')}</p>}
                        </Card>
                        <Card title={t('Parameter Comparison')} icon={<ChartBarIcon className="w-5 h-5"/>}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="border-b-2 border-color-border/50">
                                        <tr>
                                            <th className="py-2 px-3">{t('Parameter')}</th>
                                            <th className="py-2 px-3">{t('Expected')}</th>
                                            <th className="py-2 px-3">{t('Actual')}</th>
                                            <th className="py-2 px-3 text-center">{t('Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-color-border/20">
                                        {comparisonParams.map(param => (
                                            <tr key={param.name}>
                                                <td className="py-2 px-3 font-semibold">{param.name}</td>
                                                <td className="py-2 px-3 font-mono">{param.expected}</td>
                                                <td className="py-2 px-3 font-mono font-bold">{param.actual !== undefined && param.actual !== null ? `${Number(param.actual).toFixed(param.precision)} ${param.unit}` : t('N/A')}</td>
                                                <td className="py-2 px-3 text-center">
                                                    {param.inSpec === true && <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" title={t('In Spec')} />}
                                                    {param.inSpec === false && <AlertTriangleIcon className="w-5 h-5 text-red-500 mx-auto" title={t('Out of Spec')} />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- New Fermentation Section ---

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

interface LogEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<LogEntry, 'id'> | LogEntry) => void;
    entryData: Partial<LogEntry> | null;
    t: (key: string) => string;
}

const LogEntryModal: React.FC<LogEntryModalProps> = ({ isOpen, onClose, onSave, entryData, t }) => {
    const [formData, setFormData] = useState<Partial<LogEntry>>({});

    useEffect(() => {
        if (isOpen) {
            const initialDate = (entryData && entryData.timestamp) ? new Date(entryData.timestamp) : new Date();
            
            // Hack to format a local date to YYYY-MM-DDTHH:mm for datetime-local input
            const timezoneOffset = initialDate.getTimezoneOffset() * 60000; //offset in milliseconds
            const localISOTime = new Date(initialDate.getTime() - timezoneOffset).toISOString().slice(0, 16);
            
            setFormData({
                ...(entryData || {}),
                timestamp: localISOTime
            });
        }
    }, [isOpen, entryData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value === '' ? undefined : parseFloat(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.timestamp) return;

        const entryToSave = {
            ...formData,
            // The value from datetime-local is parsed as local time by new Date()
            timestamp: new Date(formData.timestamp as string).toISOString(),
            type: 'measurement' as const,
        };
        onSave(entryToSave as LogEntry);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? t('Edit Log Entry') : t('Add Log Entry')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={t('Date and Time')} type="datetime-local" name="timestamp" value={formData.timestamp || ''} onChange={handleChange} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input label={t('Temperature (°C)')} type="number" step="0.1" name="temperature" value={formData.temperature ?? ''} onChange={handleNumericChange} />
                    <Input label={t('Gravity (°P)')} type="number" step="0.1" name="gravity" value={formData.gravity ?? ''} onChange={handleNumericChange} />
                    <Input label={t('pH')} type="number" step="0.01" name="ph" value={formData.ph ?? ''} onChange={handleNumericChange} />
                    <Input label={t('Pressure (Bar)')} type="number" step="0.1" name="pressure" value={formData.pressure ?? ''} onChange={handleNumericChange} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-500">{t('Notes')}</label>
                    <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="w-full bg-color-background border border-color-border rounded-md p-2" />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                    <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Save')}</button>
                </div>
            </form>
        </Modal>
    );
};

const AdditionConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedAddition: ActualTankIngredient) => void;
    data: { planned: TankIngredient; actual: ActualTankIngredient } | null;
    masterItems: MasterItem[];
    warehouseItems: WarehouseItem[];
    t: (key:string) => string;
}> = ({ isOpen, onClose, onSave, data, masterItems, warehouseItems, t }) => {
    
    const [currentAssignments, setCurrentAssignments] = useState<LotAssignment[]>([]);
    
    useEffect(() => {
        if (data) {
            setCurrentAssignments(JSON.parse(JSON.stringify(data.actual.lotAssignments)));
        }
    }, [data]);

    if (!isOpen || !data) return null;

    const masterItem = masterItems.find(mi => mi.id === data.planned.masterItemId);
    if (!masterItem) return null;

    const totalAssigned = currentAssignments.reduce((sum, lot) => sum + (lot.quantity || 0), 0);
    const expectedQty = data.planned.quantity;
    const isComplete = Math.abs(totalAssigned - expectedQty) < 0.001;

    const availableLots = warehouseItems
        .filter(whItem => whItem.masterItemId === masterItem.id && whItem.quantity > 0)
        .map(item => item.lotNumber)
        .filter((value, index, self) => self.indexOf(value) === index);
    
    const parseValue = (value: string) => value === '' ? undefined : parseFloat(value);

    const handleAssignmentChange = (assignIndex: number, field: keyof LotAssignment, value: any) => {
        const newAssignments = [...currentAssignments];
        newAssignments[assignIndex] = { ...newAssignments[assignIndex], [field]: value };
        setCurrentAssignments(newAssignments);
    };

    const addAssignment = () => {
        setCurrentAssignments(prev => [...prev, { id: generateUniqueId('lot'), lotNumber: '', quantity: undefined }]);
    };

    const removeAssignment = (assignIndex: number) => {
        setCurrentAssignments(prev => prev.filter((_, i) => i !== assignIndex));
    };

    const handleConfirmSave = () => {
        onSave({ ...data.actual, lotAssignments: currentAssignments });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Confirm Addition')}>
            <div className="space-y-4">
                <div className="bg-color-background/50 p-3 rounded-lg border border-color-border/30">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h5 className="font-bold text-lg text-color-text">{masterItem.name}</h5>
                            <p className="text-sm text-gray-500">{t('Expected')}: {expectedQty.toFixed(2)} {masterItem.unit}</p>
                        </div>
                        <div className={`text-right text-sm font-semibold ${isComplete ? 'text-green-500' : 'text-orange-500'}`}>
                            <p><span className="font-mono">{totalAssigned.toFixed(2)} / {expectedQty.toFixed(2)}</span> {masterItem.unit}</p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {currentAssignments.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 items-center text-xs text-gray-500 font-semibold px-1">
                            <div className="col-span-7">{t('Lot Number')}</div>
                            <div className="col-span-4">{t('Quantity')}</div>
                            <div className="col-span-1"></div>
                        </div>
                    )}
                    {currentAssignments.map((assignment, assignIndex) => (
                        <div key={assignment.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-7">
                                <Select
                                    value={assignment.lotNumber}
                                    onChange={e => handleAssignmentChange(assignIndex, 'lotNumber', e.target.value)}
                                    className="w-full py-1 text-sm"
                                >
                                    <option value="">{t('Select Lot')}</option>
                                    {availableLots.map(lot => <option key={lot} value={lot}>{lot}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-4">
                                <Input
                                    type="number"
                                    step="any"
                                    value={assignment.quantity ?? ''}
                                    onChange={e => handleAssignmentChange(assignIndex, 'quantity', parseValue(e.target.value))}
                                    unit={masterItem.unit}
                                    className="py-1 text-sm"
                                />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => removeAssignment(assignIndex)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-2">
                    <button
                        type="button"
                        onClick={addAssignment}
                        className="flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>{t('Add Lot')}</span>
                    </button>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                    <button type="button" onClick={handleConfirmSave} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Confirm & Unload')}</button>
                </div>
            </div>
        </Modal>
    );
}


const FermentationSection: React.FC<{
    batch: BrewSheet;
    onDeepChange: (path: string, value: any) => void;
    onSave: (batch: BrewSheet) => void;
    t: (key: string) => string;
    masterItems: MasterItem[];
    warehouseItems: WarehouseItem[];
    onUnloadItems: (items: Omit<WarehouseItem, 'id'>[]) => void;
}> = ({ batch, onDeepChange, onSave, t, masterItems, warehouseItems, onUnloadItems }) => {
    
    const toast = useToast();
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [currentLogEntry, setCurrentLogEntry] = useState<Partial<LogEntry> | null>(null);
    const [isAdditionModalOpen, setIsAdditionModalOpen] = useState(false);
    const [currentAdditionToConfirm, setCurrentAdditionToConfirm] = useState<{ planned: TankIngredient; actual: ActualTankIngredient } | null>(null);
    const [currentBatch, setCurrentBatch] = useState<BrewSheet>(batch);

    useEffect(() => {
        setCurrentBatch(batch);
    }, [batch]);

    const chartData = useMemo<ChartData<'line'>>(() => {
        const totalDays = batch.fermentationLog.expected.steps.reduce((sum, step) => sum + step.days, 0) + 5;
        const labels = Array.from({ length: totalDays }, (_, i) => `${t('Day')} ${i}`);
        
        const plannedTemps: (number | null)[] = [];
        let cumulativeDays = 0;
        batch.fermentationLog.expected.steps.forEach(step => {
            for(let i=0; i<step.days; i++) {
                if (cumulativeDays + i < totalDays) {
                    plannedTemps[cumulativeDays + i] = step.temperature;
                }
            }
            cumulativeDays += step.days;
        });

        const actualTemps: (number | null)[] = Array(totalDays).fill(null);
        const gravities: (number | null)[] = Array(totalDays).fill(null);
        
        batch.fermentationLog.actual.logEntries.forEach(log => {
            if (log.type === 'measurement' && log.timestamp) {
                const logDate = new Date(log.timestamp);
                const cookDate = new Date(batch.cookDate);
                const dayIndex = Math.floor((logDate.getTime() - cookDate.getTime()) / (1000 * 3600 * 24));
                if (dayIndex >= 0 && dayIndex < totalDays) {
                    if(log.temperature !== undefined) actualTemps[dayIndex] = log.temperature;
                    if(log.gravity !== undefined) gravities[dayIndex] = log.gravity;
                }
            }
        });

        return {
            labels,
            datasets: [
                { label: t('Planned Temp.'), data: plannedTemps, borderColor: 'rgba(253, 126, 20, 0.5)', backgroundColor: 'rgba(253, 126, 20, 0.1)', yAxisID: 'yTemp', borderDash: [5, 5], tension: 0.1, pointRadius: 0 },
                { label: t('Actual Temp.'), data: actualTemps, borderColor: 'rgb(253, 126, 20)', backgroundColor: 'rgba(253, 126, 20, 0.2)', yAxisID: 'yTemp', tension: 0.1 },
                { label: t('Gravity (°P)'), data: gravities, borderColor: 'rgb(13, 110, 253)', backgroundColor: 'rgba(13, 110, 253, 0.2)', yAxisID: 'yGravity', tension: 0.1 },
            ]
        };
    }, [batch, t]);
    
    const chartOptions: ChartOptions<'line'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            yTemp: { type: 'linear', display: true, position: 'left', title: { display: true, text: `${t('Temperature')} (°C)` } },
            yGravity: { type: 'linear', display: true, position: 'right', title: { display: true, text: `${t('Gravity')} (°P)` }, grid: { drawOnChartArea: false } },
        }
    }), [t]);

    const timelineItems = useMemo(() => {
        const itemsByDay: Map<number, {
            date: Date;
            plannedSteps: FermentationStep[];
            plannedAdditions: TankIngredient[];
            actualEntries: LogEntry[];
        }> = new Map();

        const cookDate = new Date(`${batch.cookDate}T00:00:00Z`);

        // Process planned steps
        let cumulativeDays = 0;
        batch.fermentationLog.expected.steps.forEach(step => {
            const dayNumber = cumulativeDays;
            if (!itemsByDay.has(dayNumber)) {
                itemsByDay.set(dayNumber, { date: addDays(cookDate, dayNumber), plannedSteps: [], plannedAdditions: [], actualEntries: [] });
            }
            itemsByDay.get(dayNumber)!.plannedSteps.push(step);
            cumulativeDays += step.days;
        });

        // Process planned additions
        batch.fermentationLog.expected.additions.forEach(addition => {
            const dayNumber = addition.day;
            if (!itemsByDay.has(dayNumber)) {
                itemsByDay.set(dayNumber, { date: addDays(cookDate, dayNumber), plannedSteps: [], plannedAdditions: [], actualEntries: [] });
            }
            itemsByDay.get(dayNumber)!.plannedAdditions.push(addition);
        });

        // Process actual log entries
        batch.fermentationLog.actual.logEntries.forEach(log => {
            const logDate = new Date(log.timestamp);
            const dayNumber = Math.floor((logDate.getTime() - cookDate.getTime()) / (1000 * 3600 * 24));
            if (!itemsByDay.has(dayNumber)) {
                itemsByDay.set(dayNumber, { date: addDays(cookDate, dayNumber), plannedSteps: [], plannedAdditions: [], actualEntries: [] });
            }
            itemsByDay.get(dayNumber)!.actualEntries.push(log);
        });

        return Array.from(itemsByDay.entries())
            .sort(([dayA], [dayB]) => dayA - dayB)
            .map(([dayNumber, data]) => ({ dayNumber, ...data }));

    }, [batch]);
    
    const handleOpenLogModal = (entry?: Partial<LogEntry>) => {
        setCurrentLogEntry(entry || { timestamp: new Date().toISOString() });
        setIsLogModalOpen(true);
    };

    const handleSaveLogEntry = (entryToSave: Omit<LogEntry, 'id'> | LogEntry) => {
        const existingEntries = batch.fermentationLog.actual.logEntries;
        let newEntries: LogEntry[];

        if ('id' in entryToSave && entryToSave.id) {
            newEntries = existingEntries.map(e => e.id === entryToSave.id ? entryToSave : e);
        } else {
            const newEntry: LogEntry = { ...(entryToSave as Omit<LogEntry, 'id'>), id: generateUniqueId('log') };
            newEntries = [...existingEntries, newEntry];
        }

        newEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        onDeepChange('fermentationLog.actual.logEntries', newEntries);
        setIsLogModalOpen(false);
    };

    const handleDeleteLogEntry = (id: string) => {
        const newEntries = batch.fermentationLog.actual.logEntries.filter(e => e.id !== id);
        onDeepChange('fermentationLog.actual.logEntries', newEntries);
    };

    const handleOpenAdditionModal = (plannedAddition: TankIngredient) => {
        const actualAddition = batch.fermentationLog.actual.additions.find(a => a.id === plannedAddition.id);
        if (actualAddition) {
            setCurrentAdditionToConfirm({ planned: plannedAddition, actual: actualAddition });
            setIsAdditionModalOpen(true);
        }
    };

    const handleSaveAdditionConfirmation = (updatedActualAddition: ActualTankIngredient) => {
        const itemsToUnload = updatedActualAddition.lotAssignments
            .filter(assign => assign.lotNumber && assign.quantity && assign.quantity > 0)
            .map(assignment => ({
                masterItemId: updatedActualAddition.masterItemId,
                lotNumber: assignment.lotNumber,
                quantity: assignment.quantity!,
                locationId: '',
                expiryDate: '',
                documentNumber: `BREW-${batch.lot}`,
                arrivalDate: batch.cookDate,
            }));
    
        // Create a deep copy of the current batch state to modify
        const newBatch = JSON.parse(JSON.stringify(currentBatch));
    
        // Mark as unloaded only if items were actually sent to be unloaded
        const finalActualAddition = { ...updatedActualAddition, unloaded: itemsToUnload.length > 0 };
    
        // Update the additions array in our new batch object
        const newActualAdditions = newBatch.fermentationLog.actual.additions.map((a: ActualTankIngredient) =>
            a.id === finalActualAddition.id ? finalActualAddition : a
        );
        newBatch.fermentationLog.actual.additions = newActualAdditions;
    
        // Perform the unload side-effect
        if (itemsToUnload.length > 0) {
            onUnloadItems(itemsToUnload as Omit<WarehouseItem, 'id'>[]);
            const masterItem = masterItems.find(mi => mi.id === updatedActualAddition.masterItemId);
            toast.success(`${masterItem?.name} ${t('unloaded successfully')}.`);
        }
    
        // Persist the entire updated batch object
        onSave(newBatch);
    
        setIsAdditionModalOpen(false);
    };


    return (
        <div className="space-y-6">
            <LogEntryModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} onSave={handleSaveLogEntry} entryData={currentLogEntry} t={t} />
            <AdditionConfirmationModal 
                isOpen={isAdditionModalOpen} 
                onClose={() => setIsAdditionModalOpen(false)}
                onSave={handleSaveAdditionConfirmation}
                data={currentAdditionToConfirm}
                masterItems={masterItems}
                warehouseItems={warehouseItems}
                t={t}
            />
            <Card title={t('Fermentation Chart')} icon={<ChartBarIcon className="w-5 h-5"/>}>
                <div className="h-64"><Line options={chartOptions} data={chartData} /></div>
            </Card>

            <Card title={t('Fermentation Log')} icon={<ClipboardListIcon className="w-5 h-5"/>}>
                <div className="flex justify-end mb-4">
                    <button onClick={() => handleOpenLogModal()} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>{t('Add Log Entry')}</span>
                    </button>
                </div>
                <div className="space-y-4">
                    {timelineItems.map(({ dayNumber, date, plannedSteps, plannedAdditions, actualEntries }) => (
                        <div key={dayNumber} className="bg-color-background/50 p-3 rounded-lg">
                            <h4 className="font-bold text-color-secondary border-b border-color-border/30 pb-1 mb-2">{t('Day')} {dayNumber} <span className="text-sm font-normal text-gray-500">- {date.toLocaleDateString()}</span></h4>
                            <div className="space-y-3">
                                {plannedSteps.map(step => (
                                    <div key={step.id} className="flex items-center space-x-2 text-sm text-gray-600">
                                        <ThermometerIcon className="w-5 h-5 text-blue-500 flex-shrink-0"/>
                                        <span>{t('Planned')}: {step.description} @ {step.temperature}°C ({step.days} {t('days')})</span>
                                    </div>
                                ))}
                                {plannedAdditions.map(add => {
                                    const item = masterItems.find(mi => mi.id === add.masterItemId);
                                    const actualAddition = batch.fermentationLog.actual.additions.find(a => a.id === add.id);
                                    const isUnloaded = actualAddition?.unloaded;

                                    return (
                                        <div key={add.id}>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <HopsIcon className="w-5 h-5 text-green-500 flex-shrink-0"/>
                                                <span>{t('Planned')}: {t('Add')} {add.quantity} {item?.unit} {item?.name}</span>
                                            </div>
                                            {isUnloaded ? (
                                                <div className="pl-7 mt-1 text-xs space-y-0.5">
                                                    <p className="font-semibold text-green-600 flex items-center gap-1">
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                        {t('Confirmed & Unloaded')}
                                                    </p>
                                                    {actualAddition?.lotAssignments.map(lot => (
                                                        <div key={lot.id} className="text-gray-500 pl-1">
                                                            <span className="font-mono">{lot.lotNumber}</span>: <span className="font-mono">{lot.quantity?.toFixed(2)} {item?.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="pl-7 mt-1">
                                                    <button
                                                        onClick={() => handleOpenAdditionModal(add)}
                                                        className="flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors py-1 px-2 rounded-md bg-color-surface/60 hover:bg-color-surface border border-color-border/30"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                        <span>{t('Confirm Activity')}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {actualEntries.map(log => (
                                    <div key={log.id} className="bg-white/50 p-2 rounded-md">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-start space-x-2 text-sm flex-grow min-w-0">
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {log.type === 'transfer' ? <ArrowRightLeftIcon className="w-5 h-5 text-yellow-500"/> : <ClipboardListIcon className="w-5 h-5 text-purple-500"/>}
                                                </div>
                                                <div className="flex-grow">
                                                    <span className="font-semibold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {log.type === 'measurement' ? (
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1 text-gray-600">
                                                            {log.temperature !== undefined && <span>{t('Temp.')}: <strong className="font-mono text-color-text">{log.temperature}°C</strong></span>}
                                                            {log.gravity !== undefined && <span>{t('Gravity')}: <strong className="font-mono text-color-text">{log.gravity}°P</strong></span>}
                                                            {log.ph !== undefined && <span>{t('pH')}: <strong className="font-mono text-color-text">{log.ph}</strong></span>}
                                                            {log.pressure !== undefined && <span>{t('Pressure')}: <strong className="font-mono text-color-text">{log.pressure} Bar</strong></span>}
                                                        </div>
                                                    ) : null}
                                                    {log.notes && (
                                                        <p className="text-xs text-gray-600 mt-1 italic">
                                                            {log.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1 flex-shrink-0">
                                                {log.type !== 'transfer' && (
                                                    <>
                                                        <button onClick={() => handleOpenLogModal(log)} className="p-1 text-gray-400 hover:text-color-accent rounded-full hover:bg-color-accent/10" aria-label={t('Edit Log Entry')}><PencilIcon className="w-4 h-4"/></button>
                                                        <button onClick={() => handleDeleteLogEntry(log.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100" aria-label={t('Delete Log Entry')}><TrashIcon className="w-4 h-4"/></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default BrewSheetPage;
