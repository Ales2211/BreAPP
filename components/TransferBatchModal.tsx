import React, { useState, useMemo, useEffect } from 'react';
import { BrewSheet, Recipe, Location } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';

interface TransferBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (batchId: string, newFermenterId: string, transferDate: string) => void;
    batch: BrewSheet | null;
    locations: Location[];
    recipes: Recipe[];
    batches: BrewSheet[];
}

const TransferBatchModal: React.FC<TransferBatchModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    batch,
    locations,
    recipes,
    batches
}) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
    const [newFermenterId, setNewFermenterId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTransferDate(new Date().toISOString().split('T')[0]);
            setNewFermenterId('');
        }
    }, [isOpen]);

    const availableTanks = useMemo(() => {
        if (!batch) return [];
        
        const recipe = recipes.find(r => r.id === batch.recipeId);
        if (!recipe) return [];

        const requiredVolume = recipe.qualityControlSpec.liters.target;

        const parseDateAsUTC = (dateString: string) => {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        };
        const transferDateUTC = parseDateAsUTC(transferDate);

        return locations.filter(loc => {
            // Must be a tank, not the current one, and have enough volume
            if (loc.type !== 'Tank' || loc.id === batch.fermenterId || (loc.grossVolumeL || 0) < requiredVolume) {
                return false;
            }

            // Must not be occupied on the transfer date
            const isOccupied = batches.some(b => {
                if (b.fermenterId !== loc.id || b.status === 'Completed' || b.id === batch.id) {
                    return false;
                }
                const bRecipe = recipes.find(r => r.id === b.recipeId);
                if (!bRecipe) return false;

                const startDate = parseDateAsUTC(b.cookDate);
                
                let lastOccupiedDate: Date;
                if (b.packagingLog.packagingDate) {
                    lastOccupiedDate = parseDateAsUTC(b.packagingLog.packagingDate);
                } else {
                    const duration = bRecipe.fermentationSteps.reduce((sum, step) => sum + step.days, 0);
                    lastOccupiedDate = new Date(startDate.getTime());
                    lastOccupiedDate.setUTCDate(lastOccupiedDate.getUTCDate() + duration);
                }
                
                return transferDateUTC >= startDate && transferDateUTC <= lastOccupiedDate;
            });

            return !isOccupied;
        });
    }, [batch, transferDate, locations, recipes, batches]);

    useEffect(() => {
        if (availableTanks.length > 0) {
            setNewFermenterId(availableTanks[0].id);
        } else {
            setNewFermenterId('');
        }
    }, [availableTanks]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!batch || !newFermenterId || !transferDate) return;

        if (newFermenterId === batch.fermenterId) {
            toast.error(t('The destination tank must be different from the source.'));
            return;
        }

        onConfirm(batch.id, newFermenterId, transferDate);
        onClose();
    };

    if (!isOpen || !batch) return null;
    
    const currentTank = locations.find(l => l.id === batch.fermenterId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('Transfer Batch')} - ${batch.lot}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <p>{t('Batch')}: <span className="font-semibold">{batch.beerName}</span></p>
                    <p>{t('From')}: <span className="font-semibold">{currentTank?.name}</span></p>
                </div>
                <Input
                    label={t('Transfer Date')}
                    type="date"
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    required
                />
                <Select
                    label={t('To Location')}
                    value={newFermenterId}
                    onChange={e => setNewFermenterId(e.target.value)}
                    required
                >
                    <option value="">{t('Select destination tank...')}</option>
                    {availableTanks.map(tank => (
                        <option key={tank.id} value={tank.id}>
                            {tank.name} ({tank.grossVolumeL} L)
                        </option>
                    ))}
                </Select>
                {availableTanks.length === 0 && (
                    <p className="text-sm text-red-500">{t('No suitable tanks available for this date and volume.')}</p>
                )}
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                    <button type="submit" disabled={!newFermenterId} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400">
                        {t('Confirm Transfer')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TransferBatchModal;
