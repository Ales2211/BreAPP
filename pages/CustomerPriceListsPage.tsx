import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, MasterItem, AdministrationSettings, Customer, CustomerPriceList, ItemDiscount } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useTranslation } from '../hooks/useTranslation';
import { ChartBarIcon, UsersIcon, DownloadIcon, FileSpreadsheetIcon } from '../components/Icons';

declare global {
  interface Window {
    jspdf: any;
    XLSX: any;
  }
}

interface CustomerPriceListsPageProps {
  recipes: Recipe[];
  masterItems: MasterItem[];
  customers: Customer[];
  administrationSettings: AdministrationSettings;
  customerPriceLists: CustomerPriceList[];
  onSavePriceList: (priceList: CustomerPriceList) => void;
}

const CustomerPriceListsPage: React.FC<CustomerPriceListsPageProps> = ({
  recipes,
  masterItems,
  customers,
  administrationSettings,
  customerPriceLists,
  onSavePriceList,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'priceLists' | 'overview'>('priceLists');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedCustomerId) {
        const priceList = customerPriceLists.find(pl => pl.customerId === selectedCustomerId);
        if (priceList) {
            setGlobalDiscount(priceList.globalDiscountPercent || 0);
            const discounts = priceList.itemDiscounts.reduce((acc, item) => {
                acc[item.masterItemId] = item.discountPercent;
                return acc;
            }, {} as Record<string, number>);
            setItemDiscounts(discounts);
        } else {
            setGlobalDiscount(0);
            setItemDiscounts({});
        }
    } else {
        setGlobalDiscount(0);
        setItemDiscounts({});
    }
  }, [selectedCustomerId, customerPriceLists]);

  const filteredData = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return recipes.map(recipe => {
        const filteredPackagedItems = recipe.packagedItems.map(pItem => {
            const masterItem = masterItems.find(mi => mi.id === pItem.masterItemId);
            return masterItem;
        }).filter((item): item is MasterItem => 
            !!item && item.name.toLowerCase().includes(lowercasedTerm)
        );

        if (filteredPackagedItems.length > 0) {
            return { recipe, packagedItems: filteredPackagedItems };
        }
        return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a,b) => a.recipe.name.localeCompare(b.recipe.name));
  }, [searchTerm, recipes, masterItems]);

  const handleDiscountChange = (masterItemId: string, value: string) => {
    const newDiscount = value === '' ? 0 : parseFloat(value);
    setItemDiscounts(prev => ({...prev, [masterItemId]: isNaN(newDiscount) ? 0 : newDiscount }));
  };

  const handleSave = () => {
    if (!selectedCustomerId) return;
    const priceListToSave: CustomerPriceList = {
        id: customerPriceLists.find(pl => pl.customerId === selectedCustomerId)?.id || '',
        customerId: selectedCustomerId,
        globalDiscountPercent: globalDiscount,
        itemDiscounts: Object.entries(itemDiscounts).map(([masterItemId, discountPercent]) => ({
            masterItemId,
            discountPercent: Number(discountPercent)
        })).filter(d => d.discountPercent > 0)
    };
    onSavePriceList(priceListToSave);
  };

  const handleExportToPdf = () => {
    if (!selectedCustomerId) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text(`${t('Price List for')}: ${customer.name}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('Generated on')}: ${date}`, 14, 29);

    const tableBody: any[] = [];
    const tableHead = [t('Product'), t('Base Price'), `${t('Global Discount')} %`, `${t('Item Discount')} %`, t('Final Price'), t('Final Price / L')];

    filteredData.forEach(({ recipe, packagedItems }) => {
        tableBody.push([{
            content: recipe.name,
            colSpan: 6,
            styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [40, 40, 40] }
        }]);

        packagedItems.forEach(item => {
            const basePrice = item.salePrice || 0;
            const itemDiscount = itemDiscounts[item.id] || 0;
            const finalPrice = basePrice * (1 - (globalDiscount / 100)) * (1 - (itemDiscount / 100));
            const finalPricePerLiter = (item.containerVolumeL && item.containerVolumeL > 0)
                ? finalPrice / item.containerVolumeL
                : 0;

            tableBody.push([
                item.name,
                `${basePrice.toFixed(2)} €`,
                `${globalDiscount.toFixed(1)}%`,
                `${itemDiscount.toFixed(1)}%`,
                `${finalPrice.toFixed(2)} €`,
                `${finalPricePerLiter.toFixed(2)} €`
            ]);
        });
    });

    doc.autoTable({
        head: [tableHead],
        body: tableBody,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: '#fd7e14' },
    });
    
    const fileName = `PriceList_${customer.name.replace(/\s/g, '_')}_${date}.pdf`;
    doc.save(fileName);
  };

  const handleExportToExcel = () => {
    if (!selectedCustomerId) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;
    
    const date = new Date().toISOString().split('T')[0];
    const headers = [t('Recipe'), t('Product'), t('Base Price'), `${t('Global Discount')} %`, `${t('Item Discount')} %`, t('Final Price'), t('Final Price / L')];
    
    const data: (string | number)[][] = [];
    filteredData.forEach(({ recipe, packagedItems }) => {
        packagedItems.forEach(item => {
            const basePrice = item.salePrice || 0;
            const itemDiscount = itemDiscounts[item.id] || 0;
            const finalPrice = basePrice * (1 - (globalDiscount / 100)) * (1 - (itemDiscount / 100));
            const finalPricePerLiter = (item.containerVolumeL && item.containerVolumeL > 0)
                ? finalPrice / item.containerVolumeL
                : 0;

            data.push([
                recipe.name,
                item.name,
                basePrice.toFixed(2),
                globalDiscount.toFixed(1),
                itemDiscount.toFixed(1),
                finalPrice.toFixed(2),
                finalPricePerLiter.toFixed(2)
            ]);
        });
    });

    const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Price List');
    window.XLSX.writeFile(workbook, `PriceList_${customer.name.replace(/\s/g, '_')}_${date}.xlsx`);
  };

  const handleSelectCustomerFromOverview = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab('priceLists');
  };

  const tabs = [
    { key: 'priceLists', label: 'Price Lists' },
    { key: 'overview', label: 'Customer Overview' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 flex-shrink-0">
        <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Customer Price Lists')}</h1>
        {activeTab === 'priceLists' && (
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleExportToPdf}
                        disabled={!selectedCustomerId}
                        title={t('Export PDF')}
                        className="flex items-center space-x-2 bg-color-secondary hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>PDF</span>
                    </button>
                    <button
                        onClick={handleExportToExcel}
                        disabled={!selectedCustomerId}
                        title={t('Export Excel')}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <FileSpreadsheetIcon className="w-5 h-5" />
                        <span>Excel</span>
                    </button>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={!selectedCustomerId}
                    className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {t('Save Price List')}
                </button>
            </div>
        )}
      </div>

      <div className="border-b border-color-border mb-6">
        <nav className="flex space-x-4">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
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

      {activeTab === 'priceLists' && (
        <>
            <div className="space-y-6">
                <Card title={t('Customer Selection')} icon={<UsersIcon className="w-5 h-5"/>}>
                    <p className="text-sm text-gray-500 mb-4">{t('Select a customer to view or edit their price list.')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label={t('Customer')}
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                        >
                            <option value="">{t('Select a customer...')}</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Input
                            label={t('Global Discount (%)')}
                            type="number"
                            step="0.1"
                            value={globalDiscount || ''}
                            onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                            disabled={!selectedCustomerId}
                            unit="%"
                        />
                    </div>
                </Card>
            </div>

            {selectedCustomerId && (
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="my-4">
                        <Input
                            placeholder={t('Search by product name...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 mt-2">
                        {filteredData.length > 0 ? (
                            filteredData.map(({ recipe, packagedItems }) => (
                            <Card key={recipe.id} title={recipe.name} icon={<ChartBarIcon className="w-5 h-5"/>}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b-2 border-color-border/50">
                                            <tr>
                                                <th className="p-2 w-1/3">{t('Finished Product')}</th>
                                                <th className="p-2 text-right">{t('Base Sale Price')}</th>
                                                <th className="p-2 text-right">{t('Item Specific Discount (%)')}</th>
                                                <th className="p-2 text-right">{t('Final Price')}</th>
                                                <th className="p-2 text-right">{t('Final Price / L')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-color-border/20">
                                            {packagedItems.map(item => {
                                                const basePrice = item.salePrice || 0;
                                                const itemDiscount = itemDiscounts[item.id] || 0;
                                                const finalPrice = basePrice * (1 - (globalDiscount / 100)) * (1 - (itemDiscount / 100));
                                                const finalPricePerLiter = (item.containerVolumeL && item.containerVolumeL > 0)
                                                    ? finalPrice / item.containerVolumeL
                                                    : 0;

                                                return (
                                                    <tr key={item.id}>
                                                        <td className="p-2 font-semibold">{item.name}</td>
                                                        <td className="p-2 text-right font-mono">{basePrice.toFixed(2)} €</td>
                                                        <td className="p-2 text-right">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                className="text-right font-mono w-28 py-1"
                                                                value={itemDiscounts[item.id] || ''}
                                                                onChange={(e) => handleDiscountChange(item.id, e.target.value)}
                                                                unit="%"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-right font-mono font-bold text-color-accent">{finalPrice.toFixed(2)} €</td>
                                                        <td className="p-2 text-right font-mono">{finalPricePerLiter.toFixed(2)} €</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>{t('No products match your search.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
      )}

      {activeTab === 'overview' && (
        <div className="flex-1 overflow-y-auto pr-2 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map(customer => {
                    const priceList = customerPriceLists.find(pl => pl.customerId === customer.id);
                    const hasCustomPriceList = priceList && (priceList.globalDiscountPercent > 0 || priceList.itemDiscounts.length > 0);
                    
                    return (
                        <Card 
                            key={customer.id}
                            className="cursor-pointer"
                            onClick={() => handleSelectCustomerFromOverview(customer.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-color-accent truncate">{customer.name}</h3>
                                    {customer.vatNumber && <p className="text-sm text-gray-500 truncate">{t('VAT Number')}: {customer.vatNumber}</p>}
                                </div>
                                <div className={`ml-2 flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
                                    hasCustomPriceList 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {hasCustomPriceList ? t('Custom Price List') : t('Base Price List')}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPriceListsPage;