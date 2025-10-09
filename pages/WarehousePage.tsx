import React, { useMemo, useState } from 'react';
import { WarehouseItem, MasterItem, Location, Category } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import EmptyState from '../components/ui/EmptyState';
import { ArchiveIcon, PlusCircleIcon, ArrowRightIcon, FileExportIcon, ArrowRightLeftIcon } from '../components/Icons';
import ExportStockModal, { ExportFilters } from '../components/ExportStockModal';
import WarehouseMoveModal from '../components/WarehouseMoveModal';

interface WarehousePageProps {
  warehouseItems: WarehouseItem[];
  masterItems: MasterItem[];
  locations: Location[];
  categories: Category[];
  onLoadItems: () => void;
  onUnloadItems: () => void;
  onMoveItem: (details: { masterItemId: string; lotNumber: string; fromLocationId: string; toLocationId: string; quantity: number; }) => void;
  title: string;
  showLoadButton: boolean;
}

const WarehousePage: React.FC<WarehousePageProps> = ({ warehouseItems, masterItems, locations, categories, onLoadItems, onUnloadItems, onMoveItem, title, showLoadButton }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

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
    
    // --- EXPORT LOGIC ---
    const exportToPdf = (data: any[]) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        const date = new Date().toLocaleDateString();

        doc.setFontSize(18);
        doc.text(`${t('Stock Report')}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${t('Generated on')}: ${date}`, 14, 29);

        const tableColumn = [t('Item Name'), t('Category'), t('Lot Number'), t('Quantity'), t('Unit'), t('Location'), t('Arrival Date'), t('Expiry Date')];
        const tableRows = data.map(item => [
            item.masterItem.name,
            item.categoryName,
            item.lotNumber,
            item.quantity.toFixed(2),
            item.masterItem.unit,
            item.locationName,
            item.arrivalDate,
            item.expiryDate || 'N/A'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: '#fd7e14' },
        });

        doc.save(`Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = (data: any[]) => {
        const headers = [t('Item Name'), t('Category'), t('Lot Number'), t('Quantity'), t('Unit'), t('Location'), t('Arrival Date'), t('Expiry Date')];
        const excelData = data.map(item => [
            item.masterItem.name,
            item.categoryName,
            item.lotNumber,
            item.quantity,
            item.masterItem.unit,
            item.locationName,
            item.arrivalDate,
            item.expiryDate || ''
        ]);

        const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...excelData]);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, t('Stock Report'));
        window.XLSX.writeFile(workbook, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExport = (filters: ExportFilters, format: 'pdf' | 'excel') => {
        const filtered = warehouseItems.filter(whItem => {
            const masterItem = masterItems.find(mi => mi.id === whItem.masterItemId);
            if (!masterItem) return false;

            const locationMatch = filters.locationIds.length === 0 || filters.locationIds.includes(whItem.locationId);
            
            const categoryMatch = filters.categoryIds.length === 0 || filters.categoryIds.some(catId => {
                if (masterItem.categoryId === catId) return true;
                const itemCategory = categories.find(c => c.id === masterItem.categoryId);
                return itemCategory?.parentCategoryId === catId;
            });
            
            const nameMatch = filters.itemName === '' || masterItem.name.toLowerCase().includes(filters.itemName.toLowerCase());

            return locationMatch && categoryMatch && nameMatch;
        });
        
        const exportData = filtered.map(whItem => {
            const masterItem = masterItems.find(mi => mi.id === whItem.masterItemId)!;
            return {
                ...whItem,
                masterItem,
                categoryName: getCategoryName(masterItem.categoryId),
                locationName: getLocationName(whItem.locationId),
            };
        }).sort((a,b) => a.masterItem.name.localeCompare(b.masterItem.name));

        if (format === 'pdf') {
            exportToPdf(exportData);
        } else {
            exportToExcel(exportData);
        }
    };


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
             <ExportStockModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                locations={locations.filter(l => l.type === 'LocationType_Warehouse' || l.type === 'LocationType_Other')}
                categories={categories}
            />
            <WarehouseMoveModal 
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                onConfirm={(details) => {
                    onMoveItem(details);
                    setIsMoveModalOpen(false);
                }}
                masterItems={masterItems}
                warehouseItems={warehouseItems}
                locations={locations}
            />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{title}</h1>
                <div className="flex space-x-2">
                    <button onClick={() => setIsExportModalOpen(true)} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <FileExportIcon className="w-5 h-5" />
                        <span>{t('Export Stock')}</span>
                    </button>
                    <button onClick={() => setIsMoveModalOpen(true)} className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <ArrowRightLeftIcon className="w-5 h-5" />
                        <span>{t('Move Stock')}</span>
                    </button>
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