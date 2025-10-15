import React, { useState, useMemo, useRef } from 'react';
import { MasterItem, Category, Supplier, Unit } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, TagIcon, CloudUploadIcon, FileExportIcon, DownloadIcon, ChevronDownIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

interface ItemsPageProps {
  masterItems: MasterItem[];
  categories: Category[];
  suppliers: Supplier[];
  onNewItem: () => void;
  onEditItem: (item: MasterItem) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveMultipleItems: (items: Omit<MasterItem, 'id'>[]) => void;
}

const ActionsMenu: React.FC<{
    actions: ({ label: string; icon: React.ReactNode; onClick: () => void; } | { isDivider: true })[]
}> = ({ actions }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);
    
    return (
        <div className="relative inline-block text-left" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex justify-center w-full rounded-lg shadow-md px-4 py-2 bg-color-accent text-white font-bold hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-color-background focus:ring-color-accent"
                id="menu-button-items" aria-expanded={isOpen} aria-haspopup="true"
            >
                {t('Actions')}
                <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-color-surface ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu">
                    <div className="py-1" role="none">
                        {actions.map((action, index) => {
                            if ('isDivider' in action && action.isDivider) {
                                return <hr key={`divider-${index}`} className="my-1 border-color-border" />;
                            }
                            const { label, icon, onClick } = action as { label: string; icon: React.ReactNode; onClick: () => void; };
                            return (
                                <button key={index} onClick={() => { onClick(); setIsOpen(false); }} className="text-color-text group flex items-center w-full px-4 py-2 text-sm hover:bg-color-background" role="menuitem">
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

const ItemCard: React.FC<{ item: MasterItem, categoryName: string, onEdit: () => void, onDelete: () => void, t: (key: string) => string }> = ({ item, categoryName, onEdit, onDelete, t }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            onClick={onEdit}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
            role="button"
            tabIndex={0}
            aria-label={`Edit item ${item.name}`}
            className="bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-color-accent">{item.name}</h3>
                    <p className="text-sm text-gray-500"><span className="font-semibold">{categoryName}</span></p>
                    <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mt-2">
                        <span>{t('Unit')}: {item.unit}</span>
                        {item.format && <span>{t('Format')}: {item.format} {item.unit}</span>}
                    </div>
                </div>
                 <div className="flex space-x-2">
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-red-500"
                        aria-label={`Delete item ${item.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ItemsPage: React.FC<ItemsPageProps> = ({ masterItems, categories, suppliers, onNewItem, onEditItem, onDeleteItem, onSaveMultipleItems }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
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

    const handleImportClick = () => fileInputRef.current?.click();

    const handleDownloadTemplate = () => {
        const headers = [
            'Item Name / Nome Articolo', 'Category Name / Nome Categoria', 'Unit / Unità',
            'Format / Formato', 'Container Volume (L) / Volume Contenitore (L)',
            'Default Supplier Name / Fornitore Predefinito', 'Purchase Cost / Costo Acquisto',
            'Sale Price / Prezzo Vendita', 'Reorder Point / Punto di Riordino'
        ];
        const sampleData = [
            'Pilsner Malt', 'Malt', 'Kg', 25, '', 'Weyermann Malz', 1.5, '', 500
        ];
        const worksheet = window.XLSX.utils.aoa_to_sheet([headers, [""], sampleData]); // Added empty row for clarity
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Items Template');
        window.XLSX.writeFile(workbook, 'BrewFlow_Items_Template.xlsx');
        toast.success(t('Template downloaded successfully!'));
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
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json: any[] = window.XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

                const itemsToSave: Omit<MasterItem, 'id'>[] = [];
                let skippedRows = 0;
                
                const headerMap: Record<string, string[]> = {
                    name: ['Item Name', 'Nome Articolo'], categoryName: ['Category Name', 'Nome Categoria'],
                    unit: ['Unit', 'Unità'], format: ['Format', 'Formato'],
                    containerVolumeL: ['Container Volume (L)', 'Volume Contenitore (L)'],
                    defaultSupplierName: ['Default Supplier Name', 'Fornitore Predefinito'],
                    purchaseCost: ['Purchase Cost', 'Costo Acquisto'],
                    salePrice: ['Sale Price', 'Prezzo Vendita'], reorderPoint: ['Reorder Point', 'Punto di Riordino'],
                };
                const findHeader = (row: any, keys: string[]) => keys.map(k => row[k]).find(val => val !== undefined);

                json.forEach((row, index) => {
                    const name = findHeader(row, headerMap.name);
                    const categoryName = findHeader(row, headerMap.categoryName);
                    
                    const category = categories.find(c => t(c.name).toLowerCase() === String(categoryName)?.trim().toLowerCase());
                    
                    if (!name || !category) {
                        console.error(`Skipping row ${index + 2}: Invalid data. Name or Category not found.`, { row, name, categoryName });
                        skippedRows++;
                        return;
                    }
                    
                    const supplierName = findHeader(row, headerMap.defaultSupplierName);
                    const supplier = supplierName ? suppliers.find(s => s.name.toLowerCase() === String(supplierName).trim().toLowerCase()) : undefined;

                    itemsToSave.push({
                        name: String(name),
                        categoryId: category.id,
                        unit: (findHeader(row, headerMap.unit) as Unit) || 'Kg',
                        format: findHeader(row, headerMap.format) ? parseFloat(findHeader(row, headerMap.format)) : undefined,
                        containerVolumeL: findHeader(row, headerMap.containerVolumeL) ? parseFloat(findHeader(row, headerMap.containerVolumeL)) : undefined,
                        defaultSupplierId: supplier?.id,
                        purchaseCost: findHeader(row, headerMap.purchaseCost) ? parseFloat(findHeader(row, headerMap.purchaseCost)) : undefined,
                        salePrice: findHeader(row, headerMap.salePrice) ? parseFloat(findHeader(row, headerMap.salePrice)) : undefined,
                        reorderPoint: findHeader(row, headerMap.reorderPoint) ? parseFloat(findHeader(row, headerMap.reorderPoint)) : undefined,
                    });
                });

                if (itemsToSave.length > 0) {
                    onSaveMultipleItems(itemsToSave);
                    let successMessage = `${itemsToSave.length} ${t('items imported successfully.')}`;
                    if (skippedRows > 0) {
                        toast.info(`${successMessage} ${skippedRows} ${t('rows were skipped due to errors (e.g., item not found, invalid data).')} ${t('Please check the console for details.')}`, t('File processed'));
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

    const handleExport = () => {
        const dataToExport = masterItems.map(item => ({
            name: item.name,
            category: getCategoryName(item.categoryId),
            unit: item.unit,
            format: item.format || '',
            containerVolumeL: item.containerVolumeL || '',
            supplier: suppliers.find(s => s.id === item.defaultSupplierId)?.name || '',
            purchaseCost: item.purchaseCost || '',
            salePrice: item.salePrice || '',
            reorderPoint: item.reorderPoint || '',
        }));

        const headers = [
            t('Item Name'), t('Category'), t('Unit'), t('Format'), t('Container Volume (L)'),
            t('Default Supplier'), t('Purchase Cost'), t('Sale Price'), t('Reorder Point')
        ];
        const worksheet = window.XLSX.utils.json_to_sheet(dataToExport, { header: headers });
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, t('Master Items'));
        window.XLSX.writeFile(workbook, `BrewFlow_Master_Items_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success(t('Master data exported successfully!'));
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) return masterItems;
        const lowercasedTerm = searchTerm.toLowerCase();
        return masterItems.filter(item => 
            item.name.toLowerCase().includes(lowercasedTerm) ||
            getCategoryName(item.categoryId).toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, masterItems, categories, t]);
    
    const actions = [
        { label: t('New Master Item'), icon: <PlusCircleIcon />, onClick: onNewItem },
        { isDivider: true },
        { label: t('Import Master Data'), icon: <CloudUploadIcon />, onClick: handleImportClick },
        { label: t('Export Master Data'), icon: <FileExportIcon />, onClick: handleExport },
        { label: t('Download Template'), icon: <DownloadIcon />, onClick: handleDownloadTemplate },
    ];

    return (
        <div className="h-full flex flex-col">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text">{t('Item Master Data')}</h1>
                <div className="flex items-center gap-4 w-full md:w-auto md:flex-1 md:justify-end">
                    <div className="flex-grow max-w-sm">
                        <Input
                            placeholder={t('Search by name or category...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ActionsMenu actions={actions} />
                </div>
            </div>

            {filteredItems.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredItems.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item} 
                            categoryName={getCategoryName(item.categoryId)}
                            onEdit={() => onEditItem(item)} 
                            onDelete={() => onDeleteItem(item.id)} 
                            t={t} 
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    {masterItems.length === 0 ? (
                         <EmptyState 
                            icon={<TagIcon className="w-12 h-12"/>}
                            title={t('No items found')}
                            message={t('Create your first master item, like malts or hops, to get started.')}
                            action={{
                                text: t('Create New Item'),
                                onClick: onNewItem
                            }}
                        />
                    ) : (
                        <EmptyState
                            icon={<TagIcon className="w-12 h-12"/>}
                            title={t('No items match your search.')}
                            message={t('Try a different search term or create a new item.')}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default ItemsPage;
