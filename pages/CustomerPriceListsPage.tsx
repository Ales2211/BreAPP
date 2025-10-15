
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, CustomerPriceList, MasterItem, Category, Recipe, ItemDiscount, CategoryDiscount } from '../types';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { UsersIcon, TrashIcon, PlusCircleIcon, DownloadIcon, FileSpreadsheetIcon } from '../components/Icons';

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
  customerPriceLists: CustomerPriceList[];
  onSavePriceList: (priceList: CustomerPriceList) => void;
  categories: Category[];
}

const CustomerPriceListsPage: React.FC<CustomerPriceListsPageProps> = ({
  recipes,
  masterItems,
  customers,
  customerPriceLists,
  onSavePriceList,
  categories,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [editablePriceList, setEditablePriceList] = useState<CustomerPriceList | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // FIX: Refactored logic to prevent incorrect type inference. The previous implementation's early return {}
  // caused TypeScript to infer a union type, leading to destructuring errors. This version ensures type
  // consistency by safely handling cases where the 'Finished Goods' category might not exist.
  const finishedGoodsByRecipe = useMemo<Record<string, { recipe: Recipe, items: MasterItem[] }>>(() => {
    const fgParentCat = categories.find(c => c.name === 'Finished Goods');
    let finishedGoods: MasterItem[] = [];

    if (fgParentCat) {
      const fgCategoryIds = new Set<string>([fgParentCat.id, ...categories.filter(c => c.parentCategoryId === fgParentCat.id).map(c => c.id)]);
      finishedGoods = masterItems.filter(mi => fgCategoryIds.has(mi.categoryId));
    }

    return recipes.reduce((acc, recipe) => {
      // The connection between a recipe and its finished good is through Recipe.packagedItems.
      const recipeMasterItemIds = new Set(recipe.packagedItems.map(pi => pi.masterItemId));
      const items = finishedGoods.filter(fg => recipeMasterItemIds.has(fg.id));
      if (items.length > 0) {
        acc[recipe.id] = { recipe, items };
      }
      return acc;
    }, {} as Record<string, { recipe: Recipe, items: MasterItem[] }>);
  }, [masterItems, categories, recipes]);

  useEffect(() => {
    if (selectedCustomerId) {
      const existingList = customerPriceLists.find(pl => pl.customerId === selectedCustomerId);
      setEditablePriceList(
        existingList
          ? JSON.parse(JSON.stringify(existingList))
          : {
              id: '',
              customerId: selectedCustomerId,
              globalDiscountPercent: undefined,
              itemDiscounts: [],
              categoryDiscounts: [],
            }
      );
      setActiveTab('details');
    } else {
      setEditablePriceList(null);
      setActiveTab('overview');
    }
  }, [selectedCustomerId, customerPriceLists]);
  
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) {
        return customers;
    }
    return customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

  const productData = useMemo(() => {
    if (!editablePriceList) return {};
    
    // FIX: Replaced Object.fromEntries(Object.entries(...).map(...)) with a reduce function to
    // resolve a TypeScript type inference issue where the value of a map entry was being incorrectly
    // inferred as an empty object `{}`, causing destructuring errors.
    return Object.keys(finishedGoodsByRecipe).reduce((acc, recipeId) => {
      const { recipe, items } = finishedGoodsByRecipe[recipeId];
      const products = items.map(product => {
        const basePrice = product.salePrice || 0;
        const itemDiscount = editablePriceList.itemDiscounts?.find(d => d.masterItemId === product.id);
        const category = categories.find(c => c.id === product.categoryId);
        const categoryDiscount = editablePriceList.categoryDiscounts?.find(d => d.categoryId === category?.id);
        const globalDiscount = editablePriceList.globalDiscountPercent || 0;

        let appliedDiscount = 0;
        let appliedDiscountType: 'Global' | 'Category' | 'Item' | 'None' = 'None';

        if (itemDiscount !== undefined && itemDiscount.discountPercent !== null) {
          appliedDiscount = itemDiscount.discountPercent;
          appliedDiscountType = 'Item';
        } else if (categoryDiscount && categoryDiscount.discountPercent !== undefined) {
          appliedDiscount = categoryDiscount.discountPercent;
          appliedDiscountType = 'Category';
        } else if (globalDiscount > 0) {
          appliedDiscount = globalDiscount;
          appliedDiscountType = 'Global';
        }
        
        const finalPrice = basePrice * (1 - (appliedDiscount / 100));

        return { product, basePrice, finalPrice, appliedDiscount, appliedDiscountType, category };
      });
      acc[recipeId] = { recipe, products };
      return acc;
    }, {} as Record<string, { recipe: Recipe; products: any[] }>);
  }, [finishedGoodsByRecipe, editablePriceList, categories]);

  const handleItemDiscountChange = (masterItemId: string, value: string) => {
    setEditablePriceList(prev => {
      if (!prev) return null;
      
      const newPL = { ...prev, itemDiscounts: [...(prev.itemDiscounts || [])] };
      const existingIndex = newPL.itemDiscounts.findIndex(d => d.masterItemId === masterItemId);
      
      const numValue = parseFloat(value);
      // FIX: Correctly handle 0 as a valid discount value.
      if (!isNaN(numValue)) {
        if (existingIndex > -1) {
          newPL.itemDiscounts[existingIndex].discountPercent = numValue;
        } else {
          newPL.itemDiscounts.push({ masterItemId, discountPercent: numValue });
        }
      } else {
        if (existingIndex > -1) {
          newPL.itemDiscounts.splice(existingIndex, 1);
        }
      }
      return newPL;
    });
  };

  const handleSave = () => {
    if (editablePriceList) {
      onSavePriceList(editablePriceList);
      toast.success(t('Price list saved!'));
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!editablePriceList) return;
    const customer = customers.find(c => c.id === editablePriceList.customerId);
    if (!customer) return;

    const dataToExport = Object.values(productData).flatMap(({ recipe, products }) =>
      products.map(p => {
        const itemDiscountValue = editablePriceList.itemDiscounts?.find(d => d.masterItemId === p.product.id)?.discountPercent;
        return {
          recipe: recipe.name,
          product: p.product.name,
          basePrice: p.basePrice,
          itemDiscount: itemDiscountValue,
          appliedDiscount: p.appliedDiscount,
          appliedDiscountType: p.appliedDiscountType,
          finalPrice: p.finalPrice,
        };
      })
    );
    
    const headers = [
        t('Recipe'), 
        t('Product'), 
        t('Base Sale Price'), 
        t('Item Discount'), 
        t('Applied Discount'), 
        t('Final Price')
    ];
    
    if (format === 'pdf') {
        const body = dataToExport.map(d => [
            d.recipe,
            d.product,
            `${d.basePrice.toFixed(2)} €`,
            d.itemDiscount !== undefined ? `${d.itemDiscount.toFixed(1)}%` : '-',
            `${d.appliedDiscount.toFixed(1)}% (${t(d.appliedDiscountType)})`,
            `${d.finalPrice.toFixed(2)} €`,
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        doc.text(`${t('Price List for')} ${customer.name}`, 14, 15);
        doc.autoTable({
            head: [headers],
            body: body,
            startY: 20,
        });
        doc.save(`PriceList_${customer.name.replace(/\s/g, '_')}.pdf`);
    } else { // excel
        const excelData = [headers, ...dataToExport.map(d => [
            d.recipe,
            d.product,
            d.basePrice,
            d.itemDiscount === undefined ? null : d.itemDiscount / 100, // as percentage value for Excel
            `${d.appliedDiscount.toFixed(1)}% (${t(d.appliedDiscountType)})`,
            d.finalPrice,
        ])];

        const worksheet = window.XLSX.utils.aoa_to_sheet(excelData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
        ];

        // Apply number formats
        const currencyFormat = '€ #,##0.00';
        const percentFormat = '0.0%';

        for (let i = 2; i <= dataToExport.length + 1; i++) {
            const basePriceCell = worksheet[`C${i}`];
            if (basePriceCell) {
                basePriceCell.t = 'n';
                basePriceCell.z = currencyFormat;
            }
            const itemDiscountCell = worksheet[`D${i}`];
            if (itemDiscountCell && itemDiscountCell.v !== null) {
                itemDiscountCell.t = 'n';
                itemDiscountCell.z = percentFormat;
            }
            const finalPriceCell = worksheet[`F${i}`];
            if (finalPriceCell) {
                finalPriceCell.t = 'n';
                finalPriceCell.z = currencyFormat;
            }
        }
        
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Price List');
        window.XLSX.writeFile(workbook, `PriceList_${customer.name.replace(/\s/g, '_')}.xlsx`);
    }
    toast.success(`${format.toUpperCase()} ${t('exported successfully!')}`);
  };

  const tabs = [
    { key: 'overview', label: 'Customer Overview' },
    { key: 'details', label: 'Price List Details' },
  ];

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-color-text mb-2 flex-shrink-0">{t('Customer Price Lists')}</h1>
      
      <div className="border-b border-color-border mb-6 flex-shrink-0">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`py-3 px-1 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'border-b-2 border-color-accent text-color-accent' : 'text-gray-500 hover:text-color-text'}`}>
              {t(tab.label)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="mb-4">
              <Input
                placeholder={t('Search customer...')}
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(customer => {
                const priceList = customerPriceLists.find(pl => pl.customerId === customer.id);
                let summary = t('Base Price List');
                if (priceList) {
                  const discounts = [];
                  if (priceList.globalDiscountPercent && priceList.globalDiscountPercent > 0) discounts.push(`${t('Global')}: ${priceList.globalDiscountPercent}%`);
                  if (priceList.categoryDiscounts && priceList.categoryDiscounts.length > 0) discounts.push(`${priceList.categoryDiscounts.length} ${t('category')}`);
                  if (priceList.itemDiscounts && priceList.itemDiscounts.length > 0) discounts.push(`${priceList.itemDiscounts.length} ${t('item')}`);
                  summary = `${t('Custom Price List')} (${discounts.join(', ')})`;
                }
                return (
                  <button key={customer.id} onClick={() => setSelectedCustomerId(customer.id)} className="text-left">
                    <Card className="h-full">
                        <h3 className="font-bold text-color-accent">{customer.name}</h3>
                        <p className="text-sm text-gray-500">{summary}</p>
                    </Card>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'details' && (
          <>
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="max-w-md mb-4 md:mb-0">
                  <p className="text-gray-500 mb-2">{t('Select a customer to view or edit their price list.')}</p>
                  <Select label={t('Select Customer')} value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                    <option value="">{t('Select...')}</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
                {editablePriceList && (
                    <div className="flex items-center space-x-2 self-end">
                        <button type="button" onClick={() => handleExport('pdf')} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                            <DownloadIcon className="w-5 h-5" />
                            <span>PDF</span>
                        </button>
                        <button type="button" onClick={() => handleExport('excel')} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">
                            <FileSpreadsheetIcon className="w-5 h-5" />
                            <span>Excel</span>
                        </button>
                        <button onClick={handleSave} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                            {t('Save Price List')}
                        </button>
                    </div>
                )}
              </div>
            </Card>

            {editablePriceList && (
              <Card title={`${t('Price List for')} ${customers.find(c=>c.id === selectedCustomerId)?.name}`} icon={<UsersIcon className="w-5 h-5"/>}>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-color-secondary mb-2">{t('Global & Category Discounts')}</h4>
                    <div className="bg-color-background p-3 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label={t('Global Discount')} type="number" step="0.1" unit="%" value={editablePriceList.globalDiscountPercent ?? ''} onChange={e => setEditablePriceList({...editablePriceList, globalDiscountPercent: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
                      </div>
                      
                      <div className="mt-4 space-y-2">
                          {editablePriceList.categoryDiscounts?.map((discount, index) => {
                              const finishedGoodsSubCategories = categories.filter(c => c.parentCategoryId === 'cat_fg');
                              return (
                                  <div key={index} className="flex flex-wrap items-end gap-2">
                                      <div className="flex-1 min-w-[150px]">
                                          <Select label={t('Discount on')} value={discount.categoryId} onChange={e => { const newDiscounts = [...editablePriceList.categoryDiscounts!]; newDiscounts[index].categoryId = e.target.value; setEditablePriceList({...editablePriceList, categoryDiscounts: newDiscounts}); }}>
                                              <option value="">{t('Select a category...')}</option>
                                              {finishedGoodsSubCategories.map(c => <option key={c.id} value={c.id}>{t(c.name)}</option>)}
                                          </Select>
                                      </div>
                                      <div className="flex-1 min-w-[100px]">
                                          <Input type="number" step="0.1" unit="%" value={discount.discountPercent ?? ''} onChange={e => { const newDiscounts = [...editablePriceList.categoryDiscounts!]; const val = e.target.value; newDiscounts[index].discountPercent = val === '' ? undefined : parseFloat(val); setEditablePriceList({...editablePriceList, categoryDiscounts: newDiscounts}); }} />
                                      </div>
                                      <button onClick={() => { const newDiscounts = [...editablePriceList.categoryDiscounts!]; newDiscounts.splice(index,1); setEditablePriceList({...editablePriceList, categoryDiscounts: newDiscounts}); }} className="p-2 mb-1 text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                  </div>
                              );
                          })}
                      </div>
                      
                      <button 
                          type="button" 
                          onClick={() => {
                              const fgCategories = categories.filter(c => c.parentCategoryId === 'cat_fg');
                              const newDiscount: CategoryDiscount = { categoryId: fgCategories.length > 0 ? fgCategories[0].id : '', discountPercent: undefined };
                              setEditablePriceList(prev => {
                                  if (!prev) return null;
                                  const updatedDiscounts = [...(prev.categoryDiscounts || []), newDiscount];
                                  return { ...prev, categoryDiscounts: updatedDiscounts };
                              });
                          }}
                          className="mt-3 flex items-center space-x-2 text-sm font-semibold text-color-secondary hover:text-color-accent transition-colors"
                      >
                          <PlusCircleIcon className="w-5 h-5"/>
                          <span>{t('Add Category Discount')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-color-secondary mb-2">{t('All Items')}</h4>
                    <div className="overflow-x-auto rounded-lg border border-color-border/50">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-color-background">
                                <tr>
                                    <th className="p-2">{t('Product')}</th>
                                    <th className="p-2 text-right">{t('Base Sale Price')}</th>
                                    <th className="p-2">{t('Item Discount')}</th>
                                    <th className="p-2">{t('Applied Discount')}</th>
                                    <th className="p-2 text-right">{t('Final Price')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-color-border/20">
                                {Object.values(productData).map(({ recipe, products }) => (
                                    <React.Fragment key={recipe.id}>
                                        <tr className="bg-color-background/50"><td colSpan={5} className="p-2 font-bold text-color-secondary">{recipe.name}</td></tr>
                                        {products.map(p => (
                                            <tr key={p.product.id}>
                                                <td className="p-2 font-semibold">{p.product.name}</td>
                                                <td className="p-2 text-right font-mono">{p.basePrice.toFixed(2)} €</td>
                                                <td className="p-2 w-32">
                                                    <Input type="number" step="0.1" unit="%" className="py-1 text-sm" value={editablePriceList.itemDiscounts?.find(d => d.masterItemId === p.product.id)?.discountPercent ?? ''} onChange={(e) => handleItemDiscountChange(p.product.id, e.target.value)} />
                                                </td>
                                                <td className="p-2 text-sm">{p.appliedDiscount.toFixed(1)}% <span className="text-gray-500">({t(p.appliedDiscountType)})</span></td>
                                                <td className="p-2 text-right font-mono font-bold text-color-accent">{p.finalPrice.toFixed(2)} €</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerPriceListsPage;
