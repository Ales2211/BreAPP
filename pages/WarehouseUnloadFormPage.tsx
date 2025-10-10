import React, { useState, useMemo } from 'react';
import { MasterItem, WarehouseItem } from '../types';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Select from '../components/ui/Select';

interface WarehouseUnloadFormPageProps {
  masterItems: MasterItem[];
  warehouseItems: WarehouseItem[];
  onSave: (items: Omit<WarehouseItem, 'id'>[]) => void;
  onBack: () => void;
}

type UnloadItem = {
    key: number;
    masterItemId: string;
    lotNumber: string;
    quantity: number;
}

const WarehouseUnloadFormPage: React.FC<WarehouseUnloadFormPageProps> = ({ masterItems, warehouseItems, onSave, onBack }) => {
    const { t } = useTranslation();
    const [documentNumber, setDocumentNumber] = useState('');
    const [unloadDate, setUnloadDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<UnloadItem[]>([]);
    
    // Form state for a single item being added
    const [selectedItemId, setSelectedItemId] = useState(masterItems.length > 0 ? masterItems[0].id : '');
    const [selectedLot, setSelectedLot] = useState('');
    const [quantity, setQuantity] = useState(0);

    const availableLots = useMemo(() => {
        const lotsForThisItem = warehouseItems.filter(whItem => whItem.masterItemId === selectedItemId);
        const aggregatedLots = lotsForThisItem.reduce((acc, item) => {
            acc[item.lotNumber] = (acc[item.lotNumber] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(aggregatedLots).filter(([, qty]) => Number(qty) > 0);
    }, [selectedItemId, warehouseItems]);
    
    const handleItemSelectionChange = (itemId: string) => {
        setSelectedItemId(itemId);
        setSelectedLot('');
        setQuantity(0);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || !selectedLot || quantity <= 0) {
            // Add user feedback here
            return;
        }

        const newItem: UnloadItem = {
            key: Date.now(),
            masterItemId: selectedItemId,
            lotNumber: selectedLot,
            quantity: quantity,
        };
        setItems(prev => [...prev, newItem]);
        // Reset form
        setSelectedItemId(masterItems.length > 0 ? masterItems[0].id : '');
        setSelectedLot('');
        setQuantity(0);
    };

    const handleRemoveItem = (key: number) => {
        setItems(prev => prev.filter(item => item.key !== key));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentNumber || !unloadDate || items.length === 0) {
            // Add some user feedback here if needed
            return;
        }

        const itemsToSave: Omit<WarehouseItem, 'id'>[] = items.map(item => ({
            masterItemId: item.masterItemId,
            lotNumber: item.lotNumber,
            quantity: Number(item.quantity),
            locationId: '', // Not strictly needed for unload logic
            expiryDate: '', // Not strictly needed
            documentNumber,
            arrivalDate: unloadDate,
        }));
        onSave(itemsToSave);
    };

    const selectedMasterItem = masterItems.find(mi => mi.id === selectedItemId);
    const selectedLotMaxQty = Number(availableLots.find(([lot]) => lot === selectedLot)?.[1] || 0);

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
                <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-3xl font-bold text-color-text">
                    {t('New Warehouse Unload')}
                </h1>
            </div>
            
            <div className="space-y-6">
                <Card title={t('Document Info')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('Unload_Document_Number')} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} required />
                        <Input label={t('Unload Date')} type="date" value={unloadDate} onChange={e => setUnloadDate(e.target.value)} required />
                    </div>
                </Card>

                <Card title={t('Items to Unload')}>
                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2">
                                <Select
                                    label={t('Item Name')}
                                    value={selectedItemId}
                                    onChange={e => handleItemSelectionChange(e.target.value)}
                                >
                                    {masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Select
                                    label={t('Lot Number')}
                                    value={selectedLot}
                                    onChange={e => setSelectedLot(e.target.value)}
                                    disabled={!selectedItemId || availableLots.length === 0}
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
                                label={t('Quantity')} 
                                type="number" 
                                value={quantity || ''} 
                                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                                max={selectedLotMaxQty}
                                min="0"
                                disabled={!selectedLot}
                                unit={selectedMasterItem?.unit}
                            />
                        </div>
                        <button type="submit" className="flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>{t('Add Item to Unload')}</span>
                        </button>
                    </form>

                    {items.length > 0 && (
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
                                        {items.map(item => {
                                            const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                                            return (
                                                <tr key={item.key} className="bg-color-background/50">
                                                    <td className="py-2 px-3">{masterItem?.name}</td>
                                                    <td className="py-2 px-3">{item.lotNumber}</td>
                                                    <td className="py-2 px-3 text-right font-mono">{item.quantity.toFixed(2)} {masterItem?.unit}</td>
                                                    <td className="py-2 px-3 text-right">
                                                        <button type="button" onClick={() => handleRemoveItem(item.key)} className="p-1 text-red-500 hover:text-red-400">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

             <div className="mt-8 flex justify-end space-x-4">
                 <button type="button" onClick={onBack} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                    {t('Cancel')}
                </button>
                <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    {t('Save Unload')}
                </button>
            </div>
        </form>
    );
};

export default WarehouseUnloadFormPage;