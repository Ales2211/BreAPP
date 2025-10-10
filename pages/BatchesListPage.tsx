import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, Recipe, Location } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, ArrowRightIcon, TrashIcon, BeakerIcon, LinkIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmationModal from '../components/ConfirmationModal';
import ChangeTankModal from '../components/ChangeTankModal';
import { useToast } from '../hooks/useToast';

interface BatchesListPageProps {
    batches: BrewSheet[];
    recipes: Recipe[];
    locations: Location[];
    onSelectBatch: (batch: BrewSheet) => void;
    onCreateBatch: (recipeId: string, details: { cookDate: string; fermenterId: string; }) => void;
    onDeleteBatch: (batchId: string) => void;
    onCreateLinkedBatch: (parentBatchId: string, cookDate: string, fermenterIdOverride?: string) => void;
    onUpdateBatchDetails: (batchId: string, updates: Partial<BrewSheet>) => void;
}

const statusColors: { [key in BrewSheet['status']]: string } = {
    'Planned': 'bg-blue-500',
    'In Progress': 'bg-yellow-500',
    'Fermenting': 'bg-purple-500',
    'Packaged': 'bg-green-500',
    'Completed': 'bg-gray-500',
};

const BatchCard: React.FC<{ batch: BrewSheet, allBatches: BrewSheet[], onSelect: () => void, onDelete: () => void, onAddTurn: () => void, t: (key: string) => string, locations: Location[] }> = ({ batch, allBatches, onSelect, onDelete, onAddTurn, t, locations }) => {
    const fermenterName = locations.find(l => l.id === batch.fermenterId)?.name || 'N/A';
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const handleAddTurnClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddTurn();
    };

    const parentLot = useMemo(() => {
        if (!batch.linkedBatchId) return null;
        return allBatches.find(b => b.id === batch.linkedBatchId)?.lot;
    }, [batch.linkedBatchId, allBatches]);

    return (
        <div 
            onClick={onSelect} 
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${batch.beerName}, lot ${batch.lot}`}
            className="group bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="mb-2 sm:mb-0 flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-color-accent truncate">{batch.beerName}</h3>
                    <p className="text-sm text-gray-500 truncate">{t('Lot')}: {batch.lot} | {t('Cook No.')} {batch.cookNumber}</p>
                    {parentLot && (
                        <p className="text-sm text-blue-500 flex items-center mt-1"><LinkIcon className="w-4 h-4 mr-1"/>{t('Linked to lot')} {parentLot}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-2 truncate">
                        <span>{t('Cook Date')}: {batch.cookDate}</span> | <span>{t('Fermenter')}: {fermenterName}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[batch.status]}`}></div>
                        <span className="text-sm font-semibold">{t(batch.status)}</span>
                    </div>
                    {!batch.linkedBatchId && !['Completed', 'Packaged'].includes(batch.status) && (
                         <button 
                            onClick={handleAddTurnClick} 
                            className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-sm font-semibold bg-color-secondary/10 text-color-secondary hover:bg-color-secondary/20 transition-colors z-10"
                            aria-label={`Add turn for batch ${batch.beerName}, lot ${batch.lot}`}
                            title={t('Add Turn')}
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            <span>{t('Add Turn')}</span>
                        </button>
                    )}
                    <button 
                        onClick={handleDeleteClick} 
                        className="p-2 rounded-full text-gray-500 hover:bg-color-background hover:text-red-500 focus:opacity-100 transition-colors z-10"
                        aria-label={`Delete batch ${batch.beerName}, lot ${batch.lot}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface CreateBatchModalProps {
    isOpen: boolean;
    recipes: Recipe[];
    locations: Location[];
    batches: BrewSheet[];
    onClose: () => void;
    onCreate: (recipeId: string, details: { cookDate: string; fermenterId: string; }) => void;
    onValidationFail: (info: any) => void;
    t: (key: string) => string;
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ isOpen, recipes, locations, batches, onClose, onCreate, onValidationFail, t }) => {
    const [selectedRecipe, setSelectedRecipe] = useState(recipes.length > 0 ? recipes[0].id : '');
    const [cookDate, setCookDate] = useState(new Date().toISOString().split('T')[0]);
    const toast = useToast();
    
    const tanks = useMemo(() => locations.filter(l => l.type === 'Tank'), [locations]);
    const [fermenterId, setFermenterId] = useState(tanks.length > 0 ? tanks[0].id : '');

    useEffect(() => {
        if (isOpen) {
            setSelectedRecipe(recipes.length > 0 ? recipes[0].id : '');
            setCookDate(new Date().toISOString().split('T')[0]);
            const currentTanks = locations.filter(l => l.type === 'Tank');
            setFermenterId(currentTanks.length > 0 ? currentTanks[0].id : '');
        }
    }, [isOpen, recipes, locations]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecipe || !cookDate || !fermenterId) return;
        
        const recipe = recipes.find(r => r.id === selectedRecipe);
        const tank = locations.find(l => l.id === fermenterId);
        if (!recipe || !tank) return;

        // --- TANK OCCUPANCY CHECK (FIXED) ---
        const parseDateAsUTC = (dateString: string): Date => {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        };

        const newBatchStartDate = parseDateAsUTC(cookDate);

        const conflictingBatch = batches.find(b => {
            if (b.fermenterId !== fermenterId || ['Completed', 'Packaged'].includes(b.status)) {
                return false;
            }

            const existingRecipe = recipes.find(r => r.id === b.recipeId);
            if (!existingRecipe) return false;

            // Calculate the last day the tank is occupied by this batch.
            // This is either the explicit packaging date, or the calculated end of fermentation.
            let lastOccupiedDate: Date;
            if (b.packagingLog.packagingDate) {
                lastOccupiedDate = parseDateAsUTC(b.packagingLog.packagingDate);
            } else {
                const duration = existingRecipe.fermentationSteps.reduce((sum, step) => sum + step.days, 0);
                const startDate = parseDateAsUTC(b.cookDate);
                lastOccupiedDate = new Date(startDate.getTime());
                // The last occupied day is the cook date + total duration - 1.
                // e.g., A 1-day step on the cook date means duration is 1, and the last day is cookDate + 0.
                if (duration > 0) {
                    lastOccupiedDate.setUTCDate(lastOccupiedDate.getUTCDate() + duration - 1);
                }
            }

            // A conflict exists if the new batch starts on or before the last occupied day.
            return newBatchStartDate.getTime() <= lastOccupiedDate.getTime();
        });

        if (conflictingBatch) {
            const conflictingRecipe = recipes.find(r => r.id === conflictingBatch.recipeId)!;
            
            let lastOccupiedDate: Date;
             if (conflictingBatch.packagingLog.packagingDate) {
                lastOccupiedDate = parseDateAsUTC(conflictingBatch.packagingLog.packagingDate);
            } else {
                const duration = conflictingRecipe.fermentationSteps.reduce((sum, step) => sum + step.days, 0);
                const startDate = parseDateAsUTC(conflictingBatch.cookDate);
                lastOccupiedDate = new Date(startDate.getTime());
                if (duration > 0) {
                    lastOccupiedDate.setUTCDate(lastOccupiedDate.getUTCDate() + duration - 1);
                }
            }
            const firstFreeDay = new Date(lastOccupiedDate.getTime());
            firstFreeDay.setUTCDate(firstFreeDay.getUTCDate() + 1);
            
            toast.error(
                `${t('Tank')} ${tank.name} ${t('is occupied by lot')} ${conflictingBatch.lot}. ${t('Available from')} ${firstFreeDay.toLocaleDateString(undefined, { timeZone: 'UTC' })}.`
            );
            return;
        }
        // --- END OF CHECK ---

        const targetVolume = recipe.qualityControlSpec.liters.target || 0;
        const tankVolume = tank.grossVolumeL || 0;

        if (targetVolume > tankVolume) {
            onValidationFail({
                requiredVolume: targetVolume,
                pendingCreation: {
                    type: 'new',
                    data: { recipeId: selectedRecipe, cookDate, fermenterId }
                }
            });
            onClose();
        } else {
            onCreate(selectedRecipe, { cookDate, fermenterId });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
            <div 
                className="bg-color-surface p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{animation: 'fade-in-scale 0.3s forwards'}}
            >
                <h2 className="text-2xl font-bold text-color-accent mb-6">{t('Create New Batch')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select label={t('Recipe')} value={selectedRecipe} onChange={e => setSelectedRecipe(e.target.value)}>
                        {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                    <Input label={t('Cook Date')} type="date" value={cookDate} onChange={e => setCookDate(e.target.value)} required />
                    <Select label={t('Fermenter')} value={fermenterId} onChange={e => setFermenterId(e.target.value)} required>
                        {tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name} ({tank.grossVolumeL} L)</option>)}
                    </Select>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                        <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Create')}</button>
                    </div>
                </form>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

interface CreateTurnModalProps {
    isOpen: boolean;
    parentBatch: BrewSheet | null;
    allBatches: BrewSheet[];
    recipes: Recipe[];
    locations: Location[];
    onClose: () => void;
    onCreate: (cookDate: string) => void;
    onValidationFail: (info: any) => void;
    t: (key: string) => string;
}

const CreateTurnModal: React.FC<CreateTurnModalProps> = ({ isOpen, parentBatch, allBatches, recipes, locations, onClose, onCreate, onValidationFail, t }) => {
    const [cookDate, setCookDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen) {
            setCookDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentBatch) return;

        const parentRecipe = recipes.find(r => r.id === parentBatch.recipeId);
        if (!parentRecipe) return;

        const childBatches = allBatches.filter(b => b.linkedBatchId === parentBatch.id);

        let totalVolume = parentRecipe.qualityControlSpec.liters.target || 0;
        childBatches.forEach(child => {
            const childRecipe = recipes.find(r => r.id === child.recipeId);
            totalVolume += childRecipe?.qualityControlSpec.liters.target || 0;
        });
        totalVolume += parentRecipe.qualityControlSpec.liters.target || 0;

        const tank = locations.find(l => l.id === parentBatch.fermenterId);
        const tankVolume = tank?.grossVolumeL || 0;

        if (totalVolume > tankVolume) {
            onValidationFail({
                requiredVolume: totalVolume,
                pendingCreation: {
                    type: 'turn',
                    data: { parentBatch, cookDate }
                }
            });
            onClose();
        } else {
            onCreate(cookDate);
            onClose();
        }
    };
    
    if (!isOpen || !parentBatch) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
            <div 
                className="bg-color-surface p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{animation: 'fade-in-scale 0.3s forwards'}}
            >
                <h2 className="text-2xl font-bold text-color-accent mb-6">{t('Add Turn for Lot')} {parentBatch.lot}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label={t('Cook Date')} type="date" value={cookDate} onChange={e => setCookDate(e.target.value)} required />
                    <p className="text-sm text-gray-500">{t('The new batch will be linked to')} <span className="font-semibold">{parentBatch.beerName} ({t('Lot')} {parentBatch.lot})</span> {t('and will share the same fermenter.')}</p>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                        <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Create Turn')}</button>
                    </div>
                </form>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

const BatchesListPage: React.FC<BatchesListPageProps> = ({ batches, recipes, locations, onSelectBatch, onCreateBatch, onDeleteBatch, onCreateLinkedBatch, onUpdateBatchDetails }) => {
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<BrewSheet | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | BrewSheet['status']>('all');

    const [isTurnModalOpen, setIsTurnModalOpen] = useState(false);
    const [parentBatchForTurn, setParentBatchForTurn] = useState<BrewSheet | null>(null);

    const [isChangeTankModalOpen, setIsChangeTankModalOpen] = useState(false);
    const [tankValidationInfo, setTankValidationInfo] = useState<{ requiredVolume: number; pendingCreation: { type: 'new'; data: { recipeId: string; cookDate: string; fermenterId: string; } } | { type: 'turn'; data: { parentBatch: BrewSheet; cookDate: string; } } } | null>(null);


    const handleAddTurnRequest = (batch: BrewSheet) => {
        setParentBatchForTurn(batch);
        setIsTurnModalOpen(true);
    };

    const handleConfirmCreateTurn = (cookDate: string) => {
        if (parentBatchForTurn) {
            onCreateLinkedBatch(parentBatchForTurn.id, cookDate);
        }
        setIsTurnModalOpen(false);
        setParentBatchForTurn(null);
    };

    const handleDeleteRequest = (batch: BrewSheet) => {
        setBatchToDelete(batch);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (batchToDelete) {
            onDeleteBatch(batchToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setBatchToDelete(null);
    };

    const handleTankValidationFail = (info: NonNullable<typeof tankValidationInfo>) => {
        setTankValidationInfo(info);
        setIsChangeTankModalOpen(true);
    };

    const handleConfirmTankChange = (newTankId: string) => {
        if (!tankValidationInfo) return;

        const { pendingCreation } = tankValidationInfo;
        
        if (pendingCreation.type === 'new') {
            const { recipeId, cookDate } = pendingCreation.data;
            onCreateBatch(recipeId, { cookDate, fermenterId: newTankId });
        } else if (pendingCreation.type === 'turn') {
            const { parentBatch, cookDate } = pendingCreation.data;
            
            // Update parent batch
            onUpdateBatchDetails(parentBatch.id, { fermenterId: newTankId });
            
            // Update all existing child batches
            const childBatches = batches.filter(b => b.linkedBatchId === parentBatch.id);
            childBatches.forEach(child => {
                onUpdateBatchDetails(child.id, { fermenterId: newTankId });
            });

            // Create the new turn, passing the new fermenter ID to override the parent's (which might not have updated in state yet)
            onCreateLinkedBatch(parentBatch.id, cookDate, newTankId);
        }

        setIsChangeTankModalOpen(false);
        setTankValidationInfo(null);
    };
    
    const tabs: ('all' | BrewSheet['status'])[] = ['all', 'Planned', 'In Progress', 'Fermenting', 'Packaged', 'Completed'];

    const filteredBatches = useMemo(() => {
        const sorted = [...batches].sort((a, b) => new Date(b.cookDate).getTime() - new Date(a.cookDate).getTime() || b.cookNumber - a.cookNumber);
        
        const byStatus = activeTab === 'all' 
            ? sorted 
            : sorted.filter(batch => batch.status === activeTab);
        
        if (!searchTerm) {
            return byStatus;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return byStatus.filter(batch => 
            batch.beerName.toLowerCase().includes(lowercasedTerm) ||
            batch.lot.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, batches, activeTab]);

    return (
        <div className="h-full flex flex-col">
            <CreateBatchModal isOpen={isCreateModalOpen} recipes={recipes} locations={locations} batches={batches} onClose={() => setIsCreateModalOpen(false)} onCreate={onCreateBatch} onValidationFail={handleTankValidationFail} t={t} />
            <CreateTurnModal 
                isOpen={isTurnModalOpen}
                parentBatch={parentBatchForTurn}
                allBatches={batches}
                recipes={recipes}
                locations={locations}
                onClose={() => {
                    setIsTurnModalOpen(false);
                    setParentBatchForTurn(null);
                }}
                onCreate={handleConfirmCreateTurn}
                onValidationFail={handleTankValidationFail}
                t={t}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Batch')}
                message={`${t('Are you sure you want to delete batch')} ${batchToDelete?.beerName} (${t('Lot')} ${batchToDelete?.lot})? ${t('This action cannot be undone.')}`}
            />

            {tankValidationInfo && (
                <ChangeTankModal
                    isOpen={isChangeTankModalOpen}
                    onClose={() => setIsChangeTankModalOpen(false)}
                    onConfirm={handleConfirmTankChange}
                    requiredVolume={tankValidationInfo.requiredVolume}
                    currentTank={locations.find(l => l.id === (tankValidationInfo.pendingCreation.type === 'new' ? tankValidationInfo.pendingCreation.data.fermenterId : tankValidationInfo.pendingCreation.data.parentBatch.fermenterId))}
                    locations={locations}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Batches')}</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Batch')}</span>
                </button>
            </div>

            <div className="mb-4">
                <Input
                    placeholder={t('Search by name or lot number...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="border-b border-color-border mb-4">
                <nav className="flex space-x-2 md:space-x-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                                activeTab === tab
                                ? 'border-b-2 border-color-accent text-color-accent'
                                : 'text-gray-500 hover:text-color-text'
                            }`}
                        >
                            {tab === 'all' ? t('All') : t(tab)}
                        </button>
                    ))}
                </nav>
            </div>

            {filteredBatches.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredBatches.map(batch => (
                        <BatchCard 
                            key={batch.id} 
                            batch={batch}
                            allBatches={batches}
                            onSelect={() => onSelectBatch(batch)} 
                            onDelete={() => handleDeleteRequest(batch)}
                            onAddTurn={() => handleAddTurnRequest(batch)}
                            t={t}
                            locations={locations}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<BeakerIcon className="w-12 h-12"/>}
                        title={t('No batches yet')}
                        message={t('batches.list.empty.message')}
                        action={{
                            text: t('Create New Batch'),
                            onClick: () => setIsCreateModalOpen(true)
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default BatchesListPage;