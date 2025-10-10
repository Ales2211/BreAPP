import React, { useMemo, useState } from 'react';
import { Recipe, MasterItem, WarehouseItem, Supplier, BrewSheet } from '../types';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { ClipboardListIcon, ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon } from '../components/Icons';
import Input from '../components/ui/Input';

// --- Type definition for globally available libraries ---
declare global {
  interface Window {
    jspdf: any;
    XLSX: any;
  }
}

// --- Sub-Components for ProductionPlanPage ---

interface MaterialRequirementsProps {
    plannedBrewSheets: BrewSheet[];
    recipes: Recipe[];
    masterItems: MasterItem[];
    warehouseItems: WarehouseItem[];
    suppliers: Supplier[];
    t: (key: string) => string;
}

type RequirementItem = {
    masterItem: MasterItem | undefined;
    requiredQty: number;
    availableQty: number;
    netShortage: number;
    toOrderQty: number;
    orderInfo: string;
};


const MaterialRequirements: React.FC<MaterialRequirementsProps> = ({ plannedBrewSheets, recipes, masterItems, warehouseItems, suppliers, t }) => {

    const groupedRequirements = useMemo(() => {
        const required = new Map<string, number>();

        plannedBrewSheets.forEach(batch => {
            const recipe = recipes.find(r => r.id === batch.recipeId);
            if (!recipe) return;

            const allIngredients = [...recipe.mashIngredients, ...recipe.boilWhirlpoolIngredients, ...recipe.tankIngredients];

            allIngredients.forEach(ing => {
                const currentQty = required.get(ing.masterItemId) || 0;
                required.set(ing.masterItemId, currentQty + ing.quantity);
            });
        });

        const available = new Map<string, number>();
        warehouseItems.forEach(whItem => {
            const currentQty = available.get(whItem.masterItemId) || 0;
            available.set(whItem.masterItemId, currentQty + whItem.quantity);
        });

        const summary: RequirementItem[] = Array.from(required.entries()).map(([masterItemId, requiredQty]) => {
            const masterItem = masterItems.find(mi => mi.id === masterItemId);
            const availableQty = available.get(masterItemId) || 0;
            const netShortage = Math.max(0, requiredQty - availableQty);

            let toOrderQty = netShortage;
            let orderInfo = '';

            if (masterItem && masterItem.format && masterItem.format > 0 && netShortage > 0) {
                const numPackages = Math.ceil(netShortage / masterItem.format);
                toOrderQty = numPackages * masterItem.format;
                orderInfo = `(${numPackages} x ${masterItem.format} ${masterItem.unit})`;
            } else if (masterItem && masterItem.unit === 'pcs' && netShortage > 0) {
                toOrderQty = Math.ceil(netShortage);
            }

            return { masterItem, requiredQty, availableQty, netShortage, toOrderQty, orderInfo };
        }).filter(s => s.masterItem) as RequirementItem[];

        // Group by supplier
        const grouped = new Map<string, { supplier: Supplier | null; items: typeof summary }>();
        const NO_SUPPLIER_KEY = 'no_supplier';

        summary.forEach(req => {
            const supplierId = req.masterItem!.defaultSupplierId || NO_SUPPLIER_KEY;
            if (!grouped.has(supplierId)) {
                const supplier = suppliers.find(s => s.id === supplierId) || null;
                grouped.set(supplierId, { supplier, items: [] });
            }
            grouped.get(supplierId)!.items.push(req);
        });

        // Sort items within each group
        grouped.forEach(group => {
            group.items.sort((a, b) => a.masterItem!.name.localeCompare(b.masterItem!.name));
        });
        
        const sortedGrouped = Array.from(grouped.entries()).sort(([keyA, valA], [keyB, valB]) => {
            if (keyA === NO_SUPPLIER_KEY) return 1;
            if (keyB === NO_SUPPLIER_KEY) return -1;
            return valA.supplier!.name.localeCompare(valB.supplier!.name);
        });

        return sortedGrouped;
    }, [plannedBrewSheets, recipes, masterItems, warehouseItems, suppliers]);

    const handleExportToPdf = (supplier: Supplier | null, items: RequirementItem[]) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const supplierName = supplier ? supplier.name : t('Unassigned Supplier');
        const date = new Date().toLocaleDateString();

        doc.setFontSize(18);
        doc.text(`${t('Supplier Order')}: ${supplierName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${t('Date')}: ${date}`, 14, 29);

        const tableColumn = [t('Item'), t('Quantity')];
        const tableRows = items
            .filter(item => item.toOrderQty > 0)
            .map(item => [
                item.masterItem!.name,
                `${item.toOrderQty.toFixed(2)} ${item.masterItem!.unit} ${item.orderInfo}`
            ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
        });

        doc.save(`Ordine_${supplierName.replace(/\s/g, '_')}_${date}.pdf`);
    };

    const handleExportToExcel = (supplier: Supplier | null, items: RequirementItem[]) => {
        const supplierName = supplier ? supplier.name : t('Unassigned Supplier');
        const date = new Date().toISOString().split('T')[0];

        const headers = [t('Item'), t('Quantity'), t('Unit'), 'Order Info'];
        const data = items
            .filter(item => item.toOrderQty > 0)
            .map(item => [
                item.masterItem!.name,
                item.toOrderQty.toFixed(2),
                item.masterItem!.unit,
                item.orderInfo,
            ]);

        const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordine');
        window.XLSX.writeFile(workbook, `Ordine_${supplierName.replace(/\s/g, '_')}_${date}.xlsx`);
    };

    if (plannedBrewSheets.length === 0) {
        return (
            <Card title={t('Material Requirements')}>
                <div className="text-center py-8">
                    <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-color-text">{t('No_Planned_Batches_Found')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('No_Planned_Batches_Description')}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title={t('Material Requirements')}>
            <div className="space-y-4">
                {groupedRequirements.map(([supplierId, { supplier, items }]) => (
                    <details key={supplierId} open className="bg-color-background rounded-lg overflow-hidden group">
                        <summary className="p-3 cursor-pointer bg-color-surface/50 hover:bg-color-border/50 flex justify-between items-center list-none">
                            <h4 className="font-bold text-color-secondary">
                                {supplier ? supplier.name : t('Unassigned Supplier')}
                            </h4>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExportToPdf(supplier, items); }}
                                    title={t('Download PDF')}
                                    className="p-1.5 rounded-md text-red-400 bg-color-background/50 hover:bg-color-border/50 transition-colors"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExportToExcel(supplier, items); }}
                                    title={t('Download Excel')}
                                    className="p-1.5 rounded-md text-green-400 bg-color-background/50 hover:bg-color-border/50 transition-colors"
                                >
                                    <FileSpreadsheetIcon className="w-5 h-5" />
                                </button>
                                <ChevronDownIcon className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                            </div>
                        </summary>
                        <div className="p-2">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b-2 border-color-border/50">
                                        <tr>
                                            <th className="p-2">{t('Item')}</th>
                                            <th className="p-2 text-right">{t('Required')}</th>
                                            <th className="p-2 text-right">{t('Available')}</th>
                                            <th className="p-2 text-right">{t('Net Shortage')}</th>
                                            <th className="p-2 text-right">{t('To Order')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-color-border/20">
                                        {items.map(({ masterItem, requiredQty, availableQty, netShortage, toOrderQty, orderInfo }) => (
                                            <tr key={masterItem!.id}>
                                                <td className="p-2 font-semibold">{masterItem!.name}</td>
                                                <td className="p-2 text-right font-mono">{requiredQty.toFixed(2)} {masterItem!.unit}</td>
                                                <td className="p-2 text-right font-mono">{availableQty.toFixed(2)} {masterItem!.unit}</td>
                                                <td className={`p-2 text-right font-mono ${netShortage > 0 ? 'text-red-500' : ''}`}>
                                                    {netShortage.toFixed(2)} {masterItem!.unit}
                                                </td>
                                                <td className={`p-2 text-right font-mono font-bold ${toOrderQty > 0 ? 'text-color-accent' : 'text-green-500'}`}>
                                                    <div>{toOrderQty.toFixed(2)} {masterItem!.unit}</div>
                                                    {orderInfo && <div className="text-xs text-gray-500 font-normal">{orderInfo}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </details>
                ))}
            </div>
        </Card>
    );
};

// --- Annual Forecast Component ---

type AnnualForecastItem = {
    masterItem: MasterItem | undefined;
    totalRequiredQty: number;
    toOrderQty: number;
    orderInfo: string;
};

const AnnualForecast: React.FC<Omit<MaterialRequirementsProps, 'plannedBrewSheets' | 'warehouseItems'>> = ({ recipes, masterItems, suppliers, t }) => {
    const [recipeBatchCounts, setRecipeBatchCounts] = useState<Record<string, number>>(() => {
        const initialState: Record<string, number> = {};
        recipes.forEach(r => {
            initialState[r.id] = 0;
        });
        return initialState;
    });

    const handleCountChange = (recipeId: string, countStr: string) => {
        const count = parseInt(countStr, 10);
        setRecipeBatchCounts(prev => ({ ...prev, [recipeId]: isNaN(count) || count < 0 ? 0 : count }));
    };

    const groupedAnnualRequirements = useMemo(() => {
        const required = new Map<string, number>();

        Object.entries(recipeBatchCounts).forEach(([recipeId, batchCountValue]) => {
            const batchCount = Number(batchCountValue);
            if (batchCount <= 0) return;
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;

            const allIngredients = [...recipe.mashIngredients, ...recipe.boilWhirlpoolIngredients, ...recipe.tankIngredients];
            allIngredients.forEach(ing => {
                const totalQty = ing.quantity * batchCount;
                required.set(ing.masterItemId, (required.get(ing.masterItemId) || 0) + totalQty);
            });
        });

        const summary: AnnualForecastItem[] = Array.from(required.entries()).map(([masterItemId, totalRequiredQty]) => {
            const masterItem = masterItems.find(mi => mi.id === masterItemId);
            let toOrderQty = totalRequiredQty;
            let orderInfo = '';

            if (masterItem && masterItem.format && masterItem.format > 0 && totalRequiredQty > 0) {
                const numPackages = Math.ceil(totalRequiredQty / masterItem.format);
                toOrderQty = numPackages * masterItem.format;
                orderInfo = `(${numPackages} x ${masterItem.format} ${masterItem.unit})`;
            }

            return { masterItem, totalRequiredQty, toOrderQty, orderInfo };
        }).filter(s => s.masterItem) as AnnualForecastItem[];

        const grouped = new Map<string, { supplier: Supplier | null; items: AnnualForecastItem[] }>();
        const NO_SUPPLIER_KEY = 'no_supplier';
        summary.forEach(req => {
            const supplierId = req.masterItem!.defaultSupplierId || NO_SUPPLIER_KEY;
            if (!grouped.has(supplierId)) {
                grouped.set(supplierId, { supplier: suppliers.find(s => s.id === supplierId) || null, items: [] });
            }
            grouped.get(supplierId)!.items.push(req);
        });

        grouped.forEach(group => group.items.sort((a, b) => a.masterItem!.name.localeCompare(b.masterItem!.name)));

        return Array.from(grouped.entries()).sort(([keyA, valA], [keyB, valB]) => {
            if (keyA === NO_SUPPLIER_KEY) return 1;
            if (keyB === NO_SUPPLIER_KEY) return -1;
            return valA.supplier!.name.localeCompare(valB.supplier!.name);
        });
    }, [recipeBatchCounts, recipes, masterItems, suppliers]);
    
    const handleExportToPdf = (supplier: Supplier | null, items: AnnualForecastItem[]) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const supplierName = supplier ? supplier.name : t('Unassigned Supplier');
        const date = new Date().toLocaleDateString();

        doc.setFontSize(18);
        doc.text(`${t('Annual Forecast')}: ${supplierName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${t('Date')}: ${date}`, 14, 29);

        const tableColumn = [t('Item'), t('Quantity')];
        const tableRows = items.map(item => [item.masterItem!.name, `${item.toOrderQty.toFixed(2)} ${item.masterItem!.unit} ${item.orderInfo}`]);

        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 35, theme: 'grid' });
        doc.save(`Fabbisogno_Annuale_${supplierName.replace(/\s/g, '_')}_${date}.pdf`);
    };

    const handleExportToExcel = (supplier: Supplier | null, items: AnnualForecastItem[]) => {
        const supplierName = supplier ? supplier.name : t('Unassigned Supplier');
        const date = new Date().toISOString().split('T')[0];
        const headers = [t('Item'), t('Quantity'), t('Unit'), 'Order Info'];
        const data = items.map(item => [item.masterItem!.name, item.toOrderQty.toFixed(2), item.masterItem!.unit, item.orderInfo]);
        
        const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Fabbisogno');
        window.XLSX.writeFile(workbook, `Fabbisogno_Annuale_${supplierName.replace(/\s/g, '_')}_${date}.xlsx`);
    };


    return (
        <div className="space-y-6">
            <Card title={t('Set Annual Production')}>
                 <p className="text-sm text-gray-500 mb-4">{t('Annual_Requirement_Description')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.map(recipe => (
                        <Input
                            key={recipe.id}
                            label={recipe.name}
                            type="number"
                            min="0"
                            value={recipeBatchCounts[recipe.id] || ''}
                            onChange={(e) => handleCountChange(recipe.id, e.target.value)}
                            unit={t('Batches')}
                        />
                    ))}
                </div>
            </Card>

            <Card title={t('Total Annual Requirement')}>
                <div className="space-y-4">
                {groupedAnnualRequirements.map(([supplierId, { supplier, items }]) => (
                    <details key={supplierId} open className="bg-color-background rounded-lg overflow-hidden group">
                        <summary className="p-3 cursor-pointer bg-color-surface/50 hover:bg-color-border/50 flex justify-between items-center list-none">
                            <h4 className="font-bold text-color-secondary">{supplier ? supplier.name : t('Unassigned Supplier')}</h4>
                            <div className="flex items-center space-x-2">
                                <button onClick={(e) => { e.stopPropagation(); handleExportToPdf(supplier, items); }} title={t('Download PDF')} className="p-1.5 rounded-md text-red-400 bg-color-background/50 hover:bg-color-border/50 transition-colors"><DownloadIcon className="w-5 h-5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleExportToExcel(supplier, items); }} title={t('Download Excel')} className="p-1.5 rounded-md text-green-400 bg-color-background/50 hover:bg-color-border/50 transition-colors"><FileSpreadsheetIcon className="w-5 h-5" /></button>
                                <ChevronDownIcon className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                            </div>
                        </summary>
                         <div className="p-2">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b-2 border-color-border/50">
                                        <tr>
                                            <th className="p-2">{t('Item')}</th>
                                            <th className="p-2 text-right">{t('Total Required')}</th>
                                            <th className="p-2 text-right">{t('Order Suggestion')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-color-border/20">
                                        {items.map(({ masterItem, totalRequiredQty, toOrderQty, orderInfo }) => (
                                            <tr key={masterItem!.id}>
                                                <td className="p-2 font-semibold">{masterItem!.name}</td>
                                                <td className="p-2 text-right font-mono">{totalRequiredQty.toFixed(2)} {masterItem!.unit}</td>
                                                <td className="p-2 text-right font-mono font-bold text-color-accent">
                                                    <div>{toOrderQty.toFixed(2)} {masterItem!.unit}</div>
                                                    {orderInfo && <div className="text-xs text-gray-500 font-normal">{orderInfo}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </details>
                ))}
                </div>
            </Card>
        </div>
    );
}

// --- Main Page Component ---

interface ProductionPlanPageProps {
    recipes: Recipe[];
    masterItems: MasterItem[];
    warehouseItems: WarehouseItem[];
    suppliers: Supplier[];
    batches: BrewSheet[];
}

const ProductionPlanPage: React.FC<ProductionPlanPageProps> = (props) => {
    const { batches, ...rest } = props;
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'requirements' | 'forecast'>('requirements');

    const allPlannedBatches = useMemo(() => batches.filter(b => b.status === 'Planned'), [batches]);

    const tabs = [
        { key: 'requirements', label: 'Material Requirements' },
        { key: 'forecast', label: 'Annual Forecast' },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-2">{t('Production Plan')}</h1>
                 <div className="border-b border-color-border mb-6">
                    <nav className="flex space-x-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as 'requirements' | 'forecast')}
                                className={`py-3 px-1 text-sm font-semibold transition-colors ${
                                    activeTab === tab.key
                                    ? 'border-b-2 border-color-accent text-color-accent'
                                    : 'text-gray-500 hover:text-color-text'
                                }`}
                            >
                                {t(tab.label)}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'requirements' && (
                    <MaterialRequirements
                        plannedBrewSheets={allPlannedBatches}
                        recipes={props.recipes}
                        masterItems={props.masterItems}
                        warehouseItems={props.warehouseItems}
                        suppliers={props.suppliers}
                        t={t}
                    />
                )}
                {activeTab === 'forecast' && (
                    <AnnualForecast
                        recipes={props.recipes}
                        masterItems={props.masterItems}
                        suppliers={props.suppliers}
                        t={t}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductionPlanPage;