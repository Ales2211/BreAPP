

import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, Recipe, Location } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, ArrowRightIcon, TrashIcon, BeakerIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmationModal from '../components/ConfirmationModal';

interface BatchesListPageProps {
    batches: BrewSheet[];
    recipes: Recipe[];
    locations: Location[];
    onSelectBatch: (batch: BrewSheet) => void;
    onCreateBatch: (recipeId: string, details: { lot: string; cookDate: string; cookNumber: number; fermenterId: string; }) => void;
    onDeleteBatch: (batchId: string) => void;
}

const statusColors: { [key in BrewSheet['status']]: string } = {
    'Planned': 'bg-blue-500',
    'In Progress': 'bg-yellow-500',
    'Fermenting': 'bg-purple-500',
    'Packaged': 'bg-green-500',
    'Completed': 'bg-gray-500',
};

const BatchCard: React.FC<{ batch: BrewSheet, onSelect: () => void, onDelete: () => void, t: (key: string) => string, locations: Location[] }> = ({ batch, onSelect, onDelete, t, locations }) => {
    const fermenterName = locations.find(l => l.id === batch.fermenterId)?.name || 'N/A';
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        // Prevent the card's onSelect from firing.
        e.stopPropagation();
        onDelete();
    };

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
                    <div className="text-sm text-gray-500 mt-2 truncate">
                        <span>{t('Cook Date')}: {batch.cookDate}</span> | <span>{t('Fermenter')}: {fermenterName}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[batch.status]}`}></div>
                        <span className="text-sm font-semibold">{t(batch.status)}</span>
                    </div>
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

const CreateBatchModal: React.FC<{ 
    isOpen: boolean;
    recipes: Recipe[],
    locations: Location[],
    onClose: () => void, 
    onCreate: (recipeId: string, details: { lot: string; cookDate: string; cookNumber: number; fermenterId: string; }) => void,
    t: (key: string) => string 
}> = ({ isOpen, recipes, locations, onClose, onCreate, t }) => {
    const [selectedRecipe, setSelectedRecipe] = useState(recipes.length > 0 ? recipes[0].id : '');
    const [lot, setLot] = useState('');
    const [cookDate, setCookDate] = useState(new Date().toISOString().split('T')[0]);
    const [cookNumber, setCookNumber] = useState('1');
    
    const tanks = useMemo(() => locations.filter(l => l.type === 'Tank'), [locations]);
    const [fermenterId, setFermenterId] = useState(tanks.length > 0 ? tanks[0].id : '');

    useEffect(() => {
        if (isOpen) {
            // Reset form to defaults when modal opens
            setSelectedRecipe(recipes.length > 0 ? recipes[0].id : '');
            setLot('');
            setCookDate(new Date().toISOString().split('T')[0]);
            setCookNumber('1');
            const currentTanks = locations.filter(l => l.type === 'Tank');
            setFermenterId(currentTanks.length > 0 ? currentTanks[0].id : '');
        }
    }, [isOpen, recipes, locations]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericCookNumber = parseInt(cookNumber, 10);
        if (!selectedRecipe || !lot || !cookDate || !fermenterId || isNaN(numericCookNumber)) return;
        onCreate(selectedRecipe, { lot, cookDate, cookNumber: numericCookNumber, fermenterId });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
            <div 
                className="bg-color-surface p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{animation: 'fade-in-scale 0.3s forwards'}}
            >
                <h2 className="text-2xl font-bold text-color-accent mb-6">{t('Create New Batch')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select label={t('Recipe')} value={selectedRecipe} onChange={e => setSelectedRecipe(e.target.value)}>
                        {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                    <Input label={t('Lot')} value={lot} onChange={e => setLot(e.target.value)} required />
                    <Input label={t('Cook No.')} type="number" value={cookNumber} onChange={e => setCookNumber(e.target.value)} required />
                    <Input label={t('Cook Date')} type="date" value={cookDate} onChange={e => setCookDate(e.target.value)} required />
                    <Select label={t('Fermenter')} value={fermenterId} onChange={e => setFermenterId(e.target.value)} required>
                        {tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
                    </Select>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-600 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
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

const BatchesListPage: React.FC<BatchesListPageProps> = ({ batches, recipes, locations, onSelectBatch, onCreateBatch, onDeleteBatch }) => {
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State for the confirmation modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<BrewSheet | null>(null);
    
    const groupedBatches = useMemo(() => {
        const groups: { [key: string]: BrewSheet[] } = {};
        batches.forEach(batch => {
            if (!groups[batch.status]) {
                groups[batch.status] = [];
            }
            groups[batch.status].push(batch);
        });
        return groups;
    }, [batches]);

    const groupOrder: (keyof typeof statusColors)[] = ['In Progress', 'Fermenting', 'Planned', 'Packaged', 'Completed'];

    // Handler to open the confirmation modal
    const handleDeleteRequest = (batch: BrewSheet) => {
        setBatchToDelete(batch);
        setIsConfirmModalOpen(true);
    };

    // Handler to perform the deletion
    const handleConfirmDelete = () => {
        if (batchToDelete) {
            onDeleteBatch(batchToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setBatchToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <CreateBatchModal isOpen={isCreateModalOpen} recipes={recipes} locations={locations} onClose={() => setIsCreateModalOpen(false)} onCreate={onCreateBatch} t={t} />
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Batch')}
                message={`${t('Are you sure you want to delete batch')} ${batchToDelete?.beerName} (${batchToDelete?.lot})? ${t('This action cannot be undone.')}`}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Batches')}</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Batch')}</span>
                </button>
            </div>
            
            {batches.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<BeakerIcon className="w-12 h-12"/>}
                        title={t('No batches yet')}
                        message={t("batches.list.empty.message")}
                        action={{
                            text: t('Create New Batch'),
                            onClick: () => setIsCreateModalOpen(true)
                        }}
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {groupOrder.map(status => {
                        const groupBatches = groupedBatches[status];
                        if (!groupBatches || groupBatches.length === 0) {
                            return null;
                        }
                        return (
                            <div key={status}>
                                <h2 className="text-xl font-semibold mb-2 text-gray-500 border-b-2 border-color-border pb-1 flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${statusColors[status]} mr-3`}></div>
                                    {t(status)}
                                </h2>
                                <div className="space-y-4 mt-3">
                                    {groupBatches.map(batch => (
                                        <BatchCard 
                                            key={batch.id} 
                                            batch={batch} 
                                            onSelect={() => onSelectBatch(batch)} 
                                            onDelete={() => handleDeleteRequest(batch)} 
                                            t={t} 
                                            locations={locations} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default BatchesListPage;