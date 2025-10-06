import React, { useMemo, useState } from 'react';
import { WarehouseItem, MasterItem, Location, Category } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import EmptyState from '../components/ui/EmptyState';
import { ArchiveIcon, DownloadIcon, PlusCircleIcon, ArrowRightIcon } from '../components/Icons';

interface WarehousePageProps {
  warehouseItems: WarehouseItem[];
  masterItems: MasterItem[];
  locations: Location[];
  categories: Category[];
  onLoadItems: () => void;
  onUnloadItems: () => void;
  onMoveItems: (items: { warehouseItemId: string; toLocationId: string; quantity: number }[]) => void;
  title: string;
  showLoadButton: boolean;
}

const WarehousePage: React.FC<WarehousePageProps> = ({ warehouseItems, masterItems, locations, categories, onLoadItems, onUnloadItems, onMoveItems, title, showLoadButton }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return 'N/A';
        
        if (category.parentCategoryId) {
            const parent = categories.find(p => p.id === category.parentCategoryId);
            if (parent) {
                return `${t(parent.name)} - ${t(category.name)}`;
            }
        }
        return t(category.name);
    };

    const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'N/A';

    const aggregatedItems = useMemo(() => {
        const itemMap = new Map<string, { masterItem: MasterItem; totalQuantity: number; lots: (WarehouseItem & { locationName: string})[] }>();

        warehouseItems.forEach(whItem => {
            const masterItem = masterItems.find(mi => mi.id === whItem.masterItemId);
            if (!masterItem) return;
            
            if (!itemMap.has(masterItem.id)) {
                itemMap.set(masterItem.id, { masterItem, totalQuantity: 0, lots: [] });
            }

            const entry = itemMap.get(masterItem.id)!;
            entry.totalQuantity += whItem.quantity;
            entry.lots.push({ ...whItem, locationName: getLocationName(whItem.locationId) });
        });

        const sortedAndFiltered = Array.from(itemMap.values()).sort((a, b) => a.masterItem.name.localeCompare(b.masterItem.name));

        if (!searchTerm) {
            return sortedAndFiltered;
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedAndFiltered.filter(({ masterItem, lots }) =>
            masterItem.name.toLowerCase().includes(lowercasedTerm) ||
            getCategoryName(masterItem.categoryId).toLowerCase().includes(lowercasedTerm) ||
            lots.some(lot => lot.lotNumber.toLowerCase().includes(lowercasedTerm))
        );
    }, [warehouseItems, masterItems, locations, categories, searchTerm, t]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{title}</h1>
                <div className="flex space-x-2">
                    <button onClick={onUnloadItems} className="flex items-center space-x-2 bg-color-secondary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <ArrowRightIcon className="w-5 h-5 -rotate-45" />
                        <span>{t('Unload Stock')}</span>
                    </button>
                    {showLoadButton && (
                         <button onClick={onLoadItems} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                            <PlusCircleIcon className="w-6 h-6" />
                            <span>{t('Load Stock')}</span>
                        </button>
                    )}
                </div>
            </div>

             {warehouseItems.length > 0 && (
                <div className="mb-4">
                    <Input
                        placeholder={t('Search by item name, category, or lot...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2">
                {aggregatedItems.length > 0 ? (
                    <div className="space-y-4">
                        {aggregatedItems.map(({ masterItem, totalQuantity, lots }) => (
                            <Card key={masterItem.id}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-color-accent">{masterItem.name}</h3>
                                        <p className="text-sm text-gray-500">{getCategoryName(masterItem.categoryId)}</p>
                                    </div>
                                    <div className="text-lg font-semibold text-right mt-2 sm:mt-0">
                                        {totalQuantity.toFixed(2)} <span className="text-sm text-gray-500">{masterItem.unit}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto rounded-lg border border-color-border/50">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-color-background">
                                            <tr>
                                                <th className="py-2 px-3 font-semibold">{t('Lot Number')}</th>
                                                <th className="py-2 px-3 font-semibold text-right">{t('Quantity')}</th>
                                                <th className="py-2 px-3 font-semibold">{t('Location')}</th>
                                                <th className="py-2 px-3 font-semibold">{t('Arrival Date')}</th>
                                                <th className="py-2 px-3 font-semibold">{t('Expiry Date')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-color-border/50">
                                            {lots.map(lot => (
                                                <tr key={lot.id} className="bg-color-background/50">
                                                    <td className="py-2 px-3 font-mono">{lot.lotNumber}</td>
                                                    <td className="py-2 px-3 text-right font-mono">{lot.quantity.toFixed(2)} {masterItem.unit}</td>
                                                    <td className="py-2 px-3">{lot.locationName}</td>
                                                    <td className="py-2 px-3">{lot.arrivalDate}</td>
                                                    <td className="py-2 px-3">{lot.expiryDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <EmptyState 
                            icon={<ArchiveIcon className="w-12 h-12" />}
                            title={t('Warehouse is empty')}
                            message={t('Load your first stock of raw materials or finished goods.')}
                            action={showLoadButton ? {
                                text: t('Load Stock'),
                                onClick: onLoadItems,
                            } : undefined}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarehousePage;