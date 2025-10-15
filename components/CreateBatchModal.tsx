import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, Recipe, Location } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import Input from './ui/Input';
import Select from './ui/Select';
import { useToast } from '../hooks/useToast';

interface CreateBatchModalProps {
    isOpen: boolean;
    recipes: Recipe[];
    locations: Location[];
    batches: BrewSheet[];
    onClose: () => void;
    onCreate: (recipeId: string, details: { cookDate: string; fermenterId: string; }) => void;
    onValidationFail: (info: any) => void;
    t: (key: string) => string;
    initialData?: { cookDate: string; fermenterId: string; };
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ isOpen, recipes, locations, batches, onClose, onCreate, onValidationFail, t, initialData }) => {
    const [selectedRecipe, setSelectedRecipe] = useState(recipes.length > 0 ? recipes[0].id : '');
    const [cookDate, setCookDate] = useState(new Date().toISOString().split('T')[0]);
    const toast = useToast();
    
    const tanks = useMemo(() => locations.filter(l => l.type === 'Tank'), [locations]);
    const [fermenterId, setFermenterId] = useState(tanks.length > 0 ? tanks[0].id : '');

    useEffect(() => {
        if (isOpen) {
            setSelectedRecipe(recipes.length > 0 ? recipes[0].id : '');
            setCookDate(initialData?.cookDate || new Date().toISOString().split('T')[0]);
            const currentTanks = locations.filter(l => l.type === 'Tank');
            setFermenterId(initialData?.fermenterId || (currentTanks.length > 0 ? currentTanks[0].id : ''));
        }
    }, [isOpen, recipes, locations, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecipe || !cookDate || !fermenterId) return;
        
        const recipe = recipes.find(r => r.id === selectedRecipe);
        const tank = locations.find(l => l.id === fermenterId);
        if (!recipe || !tank) return;

        // --- TANK OCCUPANCY CHECK ---
        const parseDateAsUTC = (dateString: string): Date => {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        };

        const newBatchStartDate = parseDateAsUTC(cookDate);

        const conflictingBatch = batches.find(b => {
            // A tank is considered occupied if a batch is in it and is not yet completed.
            // A 'Packaged' batch occupies the tank ON its packaging day.
            if (b.fermenterId !== fermenterId || b.status === 'Completed') {
                return false;
            }

            const existingRecipe = recipes.find(r => r.id === b.recipeId);
            if (!existingRecipe) return false;

            // Calculate the last day the tank is occupied by this batch.
            // This is the packaging day.
            let lastOccupiedDate: Date;
            if (b.packagingLog.packagingDate) {
                lastOccupiedDate = parseDateAsUTC(b.packagingLog.packagingDate);
            } else {
                // If not yet packaged, the planned packaging day is after all fermentation steps.
                const duration = existingRecipe.fermentationSteps.reduce((sum, step) => sum + step.days, 0);
                const startDate = parseDateAsUTC(b.cookDate);
                lastOccupiedDate = new Date(startDate.getTime());
                lastOccupiedDate.setUTCDate(lastOccupiedDate.getUTCDate() + duration);
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
                lastOccupiedDate.setUTCDate(lastOccupiedDate.getUTCDate() + duration);
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

export default CreateBatchModal;