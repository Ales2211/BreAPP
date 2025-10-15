import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WarehouseItem, MasterItem, Location, Category } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import EmptyState from '../components/ui/EmptyState';
import { ArchiveIcon, PlusCircleIcon, ArrowRightIcon, FileExportIcon, ArrowRightLeftIcon, CloudUploadIcon, DownloadIcon, ChevronDownIcon } from '../components/Icons';
import ExportStockModal, { ExportFilters } from '../components/ExportStockModal';
import WarehouseMoveModal from '../components/WarehouseMoveModal';
import { useToast } from '../hooks/useToast';

interface WarehousePageProps {
  warehouseItems: WarehouseItem[];
  masterItems: MasterItem[];
  locations: Location[];
  categories: Category[];
  onLoadItems: (items: Omit<WarehouseItem, 'id'>[]) => void;
  onUnloadItems: () => void;
  onMoveItem: (details: { masterItemId: string; lotNumber: string; fromLocationId: string; toLocationId: string; quantity: number; }) => void;
  title: string;
  showLoadButton: boolean;
}

const ActionsMenu: React.FC<{ 
    actions: ({ label: string; icon: React.ReactNode; onClick: () => void; } | { isDivider: true })[] 
}> = ({ actions }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);
    
    return (
        <div className="relative inline-block text-left" ref={wrapperRef}>
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex justify-center w-full rounded-lg shadow-md px-4 py-2 bg-color-accent text-white font-bold hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-color-background focus:ring-color-accent"
                    id="menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    {t('Actions')}
                    <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-color-surface ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {actions.map((action, index) => {
                            if ('isDivider' in action && action.isDivider) {
                                return <hr key={`divider-${index}`} className="my-1 border-color-border" />;
                            }
                            const { label, icon, onClick } = action as { label: string; icon: React.ReactNode; onClick: () => void; };
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onClick();
                                        setIsOpen(false);
                                    }}
                                    className="text-color-text group flex items-center w-full px-4 py-2 text-sm hover:bg-color-background"
                                    role="menuitem"
                                >
                                    <div className="mr-3 h-5 w-5 text-gray-400 group-hover:text-color-accent">{icon}</div>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const WarehousePage: React.FC<WarehousePageProps> = ({ warehouseItems, masterItems, locations, categories, onLoadItems, onUnloadItems, onMoveItem, title, showLoadButton }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    // --- IMPORT LOGIC ---
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleDownloadTemplate = () => {
        const headers = [
            'Item Name / Nome Articolo',
            'Lot Number / Numero di Lotto',
            'Quantity / Quantità',
            'Location Name / Ubicazione',
            'Arrival Date / Data Arrivo (YYYY-MM-DD)',
            'Expiry Date / Data Scadenza (YYYY-MM-DD)',
            'Document Number / Numero Documento'
        ];
        const sampleData = [
            'Pilsner Malt',
            'L-2024-001',
            250,
            'Raw Materials Warehouse',
            '2024-01-15',
            '2025-01-15',
            'DDT-12345'
        ];
        const worksheet = window.XLSX.utils.aoa_to_sheet([headers, sampleData]);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Load Template');
        window.XLSX.writeFile(workbook, 'BrewFlow_Stock_Template.xlsx');
        toast.success('Template downloaded successfully!');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        event.target.value = '';

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            toast.error(t('Invalid file type. Please upload an Excel file.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = window.XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

                const itemsToLoad: Omit<WarehouseItem, 'id'>[] = [];
                let skippedRows = 0;
                
                const headerMap: Record<string, string[]> = {
                    itemName: ['Item Name', 'Nome Articolo'],
                    lotNumber: ['Lot Number', 'Numero di Lotto'],
                    quantity: ['Quantity', 'Quantità'],
                    locationName: ['Location Name', 'Ubicazione'],
                    arrivalDate: ['Arrival Date', 'Data Arrivo'],
                    expiryDate: ['Expiry Date', 'Data Scadenza'],
                    documentNumber: ['Document Number', 'Numero Documento'],
                };
                
                const findHeader = (row: any, keys: string[]): any | undefined => {
                    for(const key of keys) {
                        if(row[key] !== undefined) return row[key];
                    }
                    return undefined;
                }

                json.forEach((row, index) => {
                    const itemName = findHeader(row, headerMap.itemName);
                    const lotNumber = findHeader(row, headerMap.lotNumber);
                    const quantity = findHeader(row, headerMap.quantity);
                    const locationName = findHeader(row, headerMap.locationName);
                    const arrivalDate = findHeader(row, headerMap.arrivalDate);
                    const expiryDate = findHeader(row, headerMap.expiryDate);
                    const documentNumber = findHeader(row, headerMap.documentNumber);

                    const masterItem = masterItems.find(mi => mi.name.toLowerCase() === String(itemName)?.toLowerCase());
                    const location = locations.find(l => l.name.toLowerCase() === String(locationName)?.toLowerCase());
                    const numQuantity = parseFloat(quantity);
                    
                    if (!masterItem || !location || !lotNumber || isNaN(numQuantity) || numQuantity <= 0 || !arrivalDate) {
                        console.error(`Skipping row ${index + 2}: Invalid data.`, { row, masterItem, location, lotNumber, numQuantity, arrivalDate });
                        skippedRows++;
                        return;
                    }
                    
                    const formatDate = (date: string | Date) => {
                        if (date instanceof Date) return date.toISOString().split('T')[0];
                        return date;
                    }

                    itemsToLoad.push({
                        masterItemId: masterItem.id,
                        lotNumber: String(lotNumber),
                        quantity: numQuantity,
                        locationId: location.id,
                        arrivalDate: formatDate(arrivalDate),
                        expiryDate: expiryDate ? formatDate(expiryDate) : undefined,
                        documentNumber: documentNumber ? String(documentNumber) : `IMPORT-${new Date().toISOString().split('T')[0]}`,
                    });
                });

                if (itemsToLoad.length > 0) {
                    onLoadItems(itemsToLoad);
                    let successMessage = `${itemsToLoad.length} ${t('items imported successfully.')}`;
                    if (skippedRows > 0) {
                        successMessage += ` ${skippedRows} ${t('rows were skipped due to errors (e.g., item not found, invalid data).')} ${t('Please check the console for details.')}`;
                        toast.info(successMessage, t('File processed'));
                    } else {
                        toast.success(successMessage, t('File processed'));
                    }
                } else {
                    toast.error(`${t('No items found in the file to import.')} ${t('Make sure the columns are named correctly')}.`, t('Error processing file'));
                }

            } catch (error) {
                console.error("Error processing Excel file:", error);
                toast.error(t('Error processing file'), 'Error');
            }
        };

        reader.readAsArrayBuffer(file);
    };

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

    const actions = useMemo(() => {
        let allActions: ({ label: string; icon: React.ReactNode; onClick: () => void; } | { isDivider: true })[] = [];
        
        if (showLoadButton) {
            allActions.push({ label: t('Load Stock'), icon: <PlusCircleIcon className="w-5 h-5" />, onClick: onLoadItems });
            allActions.push({ label: t('Import from Excel'), icon: <CloudUploadIcon className="w-5 h-5" />, onClick: handleImportClick });
        }

        allActions.push({ label: t('Unload Stock'), icon: <ArrowRightIcon className="w-5 h-5 -rotate-45" />, onClick: onUnloadItems });
        allActions.push({ label: t('Move Stock'), icon: <ArrowRightLeftIcon className="w-5 h-5" />, onClick: () => setIsMoveModalOpen(true) });
        allActions.push({ isDivider: true });
        allActions.push({ label: t('Export Stock'), icon: <FileExportIcon className="w-5 h-5" />, onClick: () => setIsExportModalOpen(true) });

        if (showLoadButton) {
            allActions.push({ label: t('Download Template'), icon: <DownloadIcon className="w-5 h-5" />, onClick: handleDownloadTemplate });
        }

        return allActions.filter((action, index, arr) => {
            if ('isDivider' in action) {
                return index > 0 && index < arr.length - 1 && !('isDivider' in arr[index + 1]);
            }
            return true;
        });
    }, [t, showLoadButton, onLoadItems, onUnloadItems]);


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
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text">{title}</h1>
                <div className="flex items-center gap-4 w-full md:w-auto md:flex-1 md:justify-end">
                    <div className="flex-grow max-w-sm">
                        <Input
                            placeholder={t('Search by item name, category, or lot...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ActionsMenu actions={actions} />
                </div>
            </div>
            
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