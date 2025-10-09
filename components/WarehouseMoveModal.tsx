import React, { useState, useMemo, useEffect } from 'react';
import Modal from './ui/Modal';
import Select from './ui/Select';
import Input from './ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import { MasterItem, WarehouseItem, Location } from '../types';
import { useToast } from '../hooks/useToast';

interface WarehouseMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: { masterItemId: string; lotNumber: string; fromLocationId: string; toLocationId: string; quantity: number; }) => void;
  masterItems: MasterItem[];
  warehouseItems: WarehouseItem[];
  locations: Location[];
}

const WarehouseMoveModal: React.FC<WarehouseMoveModalProps> = ({ isOpen, onClose, onConfirm, masterItems, warehouseItems, locations }) => {
    const { t } = useTranslation();
    const toast = useToast();

    // Form State
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedLot, setSelectedLot] = useState('');
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [quantity, setQuantity] = useState<number | string>('');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedItemId('');
            setSelectedLot('');
            setFromLocationId('');
            setToLocationId('');
            setQuantity('');
        } else if (masterItems.length > 0) {
            setSelectedItemId(masterItems[0].id);
        }
    }, [isOpen, masterItems]);

    // Derived options for cascading dropdowns
    const availableLots = useMemo(() => {
        if (!selectedItemId) return [];
        const lots = warehouseItems
            .filter(item => item.masterItemId === selectedItemId)
            .map(item => item.lotNumber);
        return [...new Set(lots)]; // Unique lot numbers
    }, [selectedItemId, warehouseItems]);

    const fromLocations = useMemo(() => {
        if (!selectedLot) return [];
        return warehouseItems
            .filter(item => item.masterItemId === selectedItemId && item.lotNumber === selectedLot && item.quantity > 0)
            .map(item => locations.find(loc => loc.id === item.locationId))
            .filter((loc): loc is Location => !!loc);
    }, [selectedLot, selectedItemId, warehouseItems, locations]);

    const toLocations = useMemo(() => {
        return locations.filter(loc => loc.type !== 'Tank' && loc.id !== fromLocationId);
    }, [locations, fromLocationId]);

    const availableQuantity = useMemo(() => {
        if (!fromLocationId || !selectedLot) return 0;
        const item = warehouseItems.find(
            wh => wh.masterItemId === selectedItemId &&
                  wh.lotNumber === selectedLot &&
                  wh.locationId === fromLocationId
        );
        return item?.quantity || 0;
    }, [fromLocationId, selectedLot, selectedItemId, warehouseItems]);
    
    // Handlers for dropdown changes to reset dependent fields
    const handleItemChange = (itemId: string) => {
        setSelectedItemId(itemId);
        setSelectedLot('');
        setFromLocationId('');
        setToLocationId('');
        setQuantity('');
    };

    const handleLotChange = (lot: string) => {
        setSelectedLot(lot);
        setFromLocationId('');
        setToLocationId('');
        setQuantity('');
    };
    
    const handleFromLocationChange = (locId: string) => {
        setFromLocationId(locId);
        // Do not reset toLocationId automatically, user can pick it.
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = Number(quantity);

        if (!selectedItemId || !selectedLot || !fromLocationId || !toLocationId || !numQuantity || numQuantity <= 0) {
            return;
        }
        if (fromLocationId === toLocationId) {
            toast.error(t('Destination location must be different from source.'));
            return;
        }
        if (numQuantity > availableQuantity) {
            toast.error(t('Insufficient quantity to move.'));
            return;
        }

        onConfirm({
            masterItemId: selectedItemId,
            lotNumber: selectedLot,
            fromLocationId,
            toLocationId,
            quantity: numQuantity
        });
    };
    
    const masterItem = masterItems.find(mi => mi.id === selectedItemId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Move Stock')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select label={t('Item')} value={selectedItemId} onChange={e => handleItemChange(e.target.value)} required>
                    <option value="">{t('Select...')}</option>
                    {masterItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>

                <Select label={t('Lot Number')} value={selectedLot} onChange={e => handleLotChange(e.target.value)} disabled={!selectedItemId} required>
                    <option value="">{t('Select Lot')}</option>
                    {availableLots.map(lot => <option key={lot} value={lot}>{lot}</option>)}
                </Select>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label={t('From Location')} value={fromLocationId} onChange={e => handleFromLocationChange(e.target.value)} disabled={!selectedLot} required>
                        <option value="">{t('Select source location...')}</option>
                        {fromLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </Select>

                    <Select label={t('To Location')} value={toLocationId} onChange={e => setToLocationId(e.target.value)} disabled={!fromLocationId} required>
                        <option value="">{t('Select destination location...')}</option>
                        {toLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </Select>
                </div>

                <Input
                    label={t('Quantity to Move')}
                    type="number"
                    step="any"
                    min="0.01"
                    max={availableQuantity}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    disabled={!fromLocationId}
                    unit={masterItem?.unit}
                    required
                />
                 {fromLocationId && <p className="text-sm text-gray-500">{t('Available')}: {availableQuantity.toFixed(2)} {masterItem?.unit}</p>}

                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                    <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Confirm Move')}</button>
                </div>
            </form>
        </Modal>
    );
};

export default WarehouseMoveModal;