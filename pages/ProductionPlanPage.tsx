import React, { useMemo } from 'react';
import { Recipe, MasterItem, WarehouseItem, Supplier, BrewSheet } from '../types';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { ClipboardListIcon, ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon } from '../components/Icons';

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

const MaterialRequirements: React.FC<MaterialRequirementsProps> = ({ plannedBrewSheets, recipes, masterItems, warehouseItems, suppliers, t }) => {
    
    type RequirementItem = {
        masterItem: MasterItem | undefined;
        requiredQty: number;
        availableQty: number;
        netShortage: number;
        toOrderQty: number;
        orderInfo: string;
    };

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

    const allPlannedBatches = useMemo(() => batches.filter(b => b.status === 'Planned'), [batches]);

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Production Plan')}</h1>
            <div className="flex-1 overflow-y-auto pr-2">
                <MaterialRequirements
                    plannedBrewSheets={allPlannedBatches}
                    recipes={props.recipes}
                    masterItems={props.masterItems}
                    warehouseItems={props.warehouseItems}
                    suppliers={props.suppliers}
                    t={t}
                />
            </div>
        </div>
    );
};

export default ProductionPlanPage;