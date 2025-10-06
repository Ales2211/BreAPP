import React, { useState } from 'react';
import { MasterItem, WarehouseItem, Location } from '../types';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface WarehouseLoadFormPageProps {
  masterItems: MasterItem[];
  locations: Location[];
  onSave: (items: Omit<WarehouseItem, 'id'>[]) => void;
  onBack: () => void;
}

type LoadItem = {
    key: number; // For react key prop
    masterItemId: string;
    lotNumber: string;
    quantity: number;
    locationId: string;
    expiryDate: string;
}

const WarehouseLoadFormPage: React.FC<WarehouseLoadFormPageProps> = ({ masterItems, locations, onSave, onBack }) => {
    const { t } = useTranslation();
    const [documentNumber, setDocumentNumber] = useState('');
    const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<LoadItem[]>([]);

    // FIX: Corrected filtering to use specific 'LocationType' keys instead of generic names.
    const warehouseLocations = locations.filter(l => l.type === 'LocationType_Warehouse' || l.type === 'LocationType_Other');

    const handleAddItem = () => {
        if (masterItems.length === 0 || warehouseLocations.length === 0) return;
        const newItem: LoadItem = {
            key: Date.now(),
            masterItemId: masterItems[0].id,
            lotNumber: '',
            quantity: 0,
            locationId: warehouseLocations[0].id,
            expiryDate: '',
        };
        setItems(prev => [...prev, newItem]);
    };
    
    const handleItemChange = (index: number, field: keyof Omit<LoadItem, 'key'>, value: string | number) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    }

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentNumber || !arrivalDate || items.length === 0) {
            // Add some user feedback here if needed
            return;
        }

        const itemsToSave: Omit<WarehouseItem, 'id'>[] = items.map(item => ({
            masterItemId: item.masterItemId,
            lotNumber: item.lotNumber,
            quantity: Number(item.quantity),
            locationId: item.locationId,
            expiryDate: item.expiryDate,
            documentNumber,
            arrivalDate,
        }));
        onSave(itemsToSave);
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
                <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-3xl font-bold text-color-text">
                    {t('New Warehouse Load')}
                </h1>
            </div>
            
            <div className="space-y-6">
                <Card title={t('Document Info')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t('Document Number (DDT/Invoice)')} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} required />
                        <Input label={t('Arrival Date')} type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} required />
                    </div>
                </Card>

                <Card title={t('Items to Load')}>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                           <div key={item.key} className="bg-color-background p-3 rounded-lg space-y-2">
                                <div className="flex justify-between items-center gap-x-2">
                                    <select 
                                        className="flex-grow bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:ring-2 focus:ring-color-accent transition-colors"
                                        value={item.masterItemId}
                                        onChange={e => handleItemChange(index, 'masterItemId', e.target.value)}
                                    >
                                        {masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-400">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                    <Input 
                                        label={t('Lot Number')}
                                        value={item.lotNumber}
                                        onChange={e => handleItemChange(index, 'lotNumber', e.target.value)}
                                        required
                                    />
                                    <Input 
                                        label={t('Quantity')}
                                        type="number"
                                        step="any"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                                        required
                                    />
                                     <select 
                                        className="self-end w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:ring-2 focus:ring-color-accent transition-colors"
                                        value={item.locationId}
                                        onChange={e => handleItemChange(index, 'locationId', e.target.value)}
                                    >
                                        {warehouseLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                    </select>
                                    <Input 
                                        label={t('Expiry Date')}
                                        type="date"
                                        value={item.expiryDate}
                                        onChange={e => handleItemChange(index, 'expiryDate', e.target.value)}
                                    />
                                </div>
                           </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>{t('Add Item to Load')}</span>
                    </button>
                </Card>
            </div>

             <div className="mt-8 flex justify-end space-x-4">
                 <button type="button" onClick={onBack} className="bg-color-border hover:bg-gray-600 text-color-text font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                    {t('Cancel')}
                </button>
                <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    {t('Save Load')}
                </button>
            </div>
        </form>
    );
};

export default WarehouseLoadFormPage;
