
import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, Recipe, Location } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, ArrowRightIcon, TrashIcon, BeakerIcon, LinkIcon, ArrowRightLeftIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';
import ConfirmationModal from '../components/ConfirmationModal';
import ChangeTankModal from '../components/ChangeTankModal';
import CreateBatchModal from '../components/CreateBatchModal';
import TransferBatchModal from '../components/TransferBatchModal';

interface BatchesListPageProps {
    batches: BrewSheet[];
    recipes: Recipe[];
    locations: Location[];
    onSelectBatch: (batch: BrewSheet) => void;
    onCreateBatch: (recipeId: string, details: { cookDate: string; fermenterId: string; }) => void;
    onDeleteBatch: (batchId: string) => void;
    onCreateLinkedBatch: (parentBatchId: string, cookDate: string, fermenterIdOverride?: string) => void;
    onUpdateBatchDetails: (batchId: string, updates: Partial<BrewSheet>) => void;
    onTransferBatch: (batchId: string, newFermenterId: string, transferDate: string) => void;
}

const statusColors: { [key in BrewSheet['status']]: string } = {
    'Planned': 'bg-blue-500',
    'In Progress': 'bg-yellow-500',
    'Fermenting': 'bg-purple-500',
    'Packaged': 'bg-green-500',
    'Completed': 'bg-gray-500',
};

const BatchCard: React.FC<{ batch: BrewSheet, allBatches: BrewSheet[], onSelect: () => void, onDelete: () => void, onAddTurn: () => void, onTransfer: () => void, t: (key: string) => string, locations: Location[] }> = ({ batch, allBatches, onSelect, onDelete, onAddTurn, onTransfer, t, locations }) => {
    const fermenterName = locations.find(l => l.id === batch.fermenterId)?.name || 'N/A';
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const handleAddTurnClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddTurn();
    };

    const handleTransferClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onTransfer();
    };

    const parentLot = useMemo(() => {
        if (!batch.linkedBatchId) return null;
        const motherBatch = allBatches.find(b => b.id === batch.linkedBatchId);
        if(!motherBatch) return null;
        return motherBatch.lot.split('/')[0];
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
                <div className="flex items-center space-x-2 md:space-x-4 self-end sm:self-center">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[batch.status]}`}></div>
                        <span className="text-sm font-semibold">{t(batch.status)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {['In Progress', 'Fermenting'].includes(batch.status) && (
                            <button
                                onClick={handleTransferClick}
                                className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-sm font-semibold bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors z-10"
                                aria-label={`Transfer batch ${batch.beerName}, lot ${batch.lot}`}
                                title={t('Transfer Batch')}
                            >
                                <ArrowRightLeftIcon className="w-4 h-4" />
                                <span className="hidden md:inline">{t('Transfer')}</span>
                            </button>
                        )}
                        {!batch.linkedBatchId && !['Completed', 'Packaged'].includes(batch.status) && (
                             <button 
                                onClick={handleAddTurnClick} 
                                className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-sm font-semibold bg-color-secondary/10 text-color-secondary hover:bg-color-secondary/20 transition-colors z-10"
                                aria-label={`Add turn for batch ${batch.beerName}, lot ${batch.lot}`}
                                title={t('Add Turn')}
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                <span className="hidden md:inline">{t('Add Turn')}</span>
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

        // Find the ultimate mother batch to get the base recipe
        let motherBatch = parentBatch;
        while(motherBatch.linkedBatchId) {
            const nextParent = allBatches.find(b => b.id === motherBatch.linkedBatchId);
            if (!nextParent) break;
            motherBatch = nextParent;
        }

        const parentRecipe = recipes.find(r => r.id === motherBatch.recipeId);
        if (!parentRecipe) return;

        const allTurns = allBatches.filter(b => b.id === motherBatch.id || b.linkedBatchId === motherBatch.id);
        
        let totalVolume = allTurns.reduce((sum, turn) => {
            const turnRecipe = recipes.find(r => r.id === turn.recipeId);
            return sum + (turnRecipe?.qualityControlSpec.liters.target || 0);
        }, 0);
        totalVolume += parentRecipe.qualityControlSpec.liters.target; // For the new turn

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

const BatchesListPage: React.FC<BatchesListPageProps> = ({ batches, recipes, locations, onSelectBatch, onCreateBatch, onDeleteBatch, onCreateLinkedBatch, onUpdateBatchDetails, onTransferBatch }) => {
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

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [batchToTransfer, setBatchToTransfer] = useState<BrewSheet | null>(null);

    const handleTransferRequest = (batch: BrewSheet) => {
        setBatchToTransfer(batch);
        setIsTransferModalOpen(true);
    };

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
            <TransferBatchModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onConfirm={onTransferBatch}
                batch={batchToTransfer}
                locations={locations}
                recipes={recipes}
                batches={batches}
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

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4 flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-color-text">{t('Batches')}</h1>
                <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:justify-end">
                    <div className="flex-grow sm:max-w-xs">
                        <Input
                            placeholder={t('Search by name or lot number...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0 flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-3 rounded-lg shadow transition-transform transform hover:scale-105 text-sm">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{t('New Batch')}</span>
                    </button>
                </div>
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
                            onTransfer={() => handleTransferRequest(batch)}
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
