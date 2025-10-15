import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, MasterItem, AdministrationSettings } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import { ChartBarIcon } from '../components/Icons';

interface PriceListPageProps {
  recipes: Recipe[];
  masterItems: MasterItem[];
  administrationSettings: AdministrationSettings;
  onSaveMultipleItems: (items: MasterItem[]) => void;
}

const PriceListPage: React.FC<PriceListPageProps> = ({
  recipes,
  masterItems,
  administrationSettings,
  onSaveMultipleItems,
}) => {
  const { t } = useTranslation();
  const [prices, setPrices] = useState<Record<string, number | undefined>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initialPrices = masterItems.reduce((acc, item) => {
        acc[item.id] = item.salePrice;
        return acc;
    }, {} as Record<string, number | undefined>);
    setPrices(initialPrices);
  }, [masterItems]);

  const costData = useMemo(() => {
    const { 
        annualBatches, annualManpowerCost, annualGasCost, annualRentCost, annualWaterCost,
        annualDetergentsCost, annualCo2Cost, exciseDutyRate
    } = administrationSettings;

    const operationalCostsPerBatch = annualBatches > 0 
        ? ((annualManpowerCost || 0) + (annualGasCost || 0) + (annualRentCost || 0) + (annualWaterCost || 0) + (annualDetergentsCost || 0) + (annualCo2Cost || 0)) / annualBatches 
        : 0;

    return recipes.map(recipe => {
        const beerIngredientsCost = [...recipe.mashIngredients, ...recipe.boilWhirlpoolIngredients, ...recipe.tankIngredients]
            .reduce((acc, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                return acc + (ing.quantity * (item?.purchaseCost || 0));
            }, 0);

        const otherRecipeCosts = Object.values(recipe.additionalCosts || {}).reduce((sum: number, cost) => sum + (Number(cost) || 0), 0);
        const packagedLiters = (recipe.qualityControlSpec.liters.target || 0) * ((recipe.processParameters.packagingYield || 0) / 100);
        const exciseDutyPerBatch = (recipe.qualityControlSpec.og.target || 0) * (packagedLiters / 100) * (exciseDutyRate || 0);

        const totalBeerCost = beerIngredientsCost + operationalCostsPerBatch + otherRecipeCosts + exciseDutyPerBatch;
        const costOfBeerPerLiter = packagedLiters > 0 ? totalBeerCost / packagedLiters : 0;
      
        const packagedItemsWithCost = recipe.packagedItems.map(packagedItem => {
            const masterItem = masterItems.find(mi => mi.id === packagedItem.masterItemId);
            if (!masterItem || !masterItem.containerVolumeL) return null;

            const packagingMaterialsCost = packagedItem.packagingIngredients.reduce((acc, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                return acc + (ing.quantity * (item?.purchaseCost || 0));
            }, 0);

            const split = (packagedItem.packagingSplit || 0) / 100;
            const litersInFormat = packagedLiters * split;
            const numberOfUnits = litersInFormat / masterItem.containerVolumeL;

            const packagingCostPerUnit = numberOfUnits > 0 ? packagingMaterialsCost / numberOfUnits : 0;
            const costOfBeerInUnit = costOfBeerPerLiter * masterItem.containerVolumeL;
            
            const costPerUnit = costOfBeerInUnit + packagingCostPerUnit;
            const costPerLiter = costPerUnit / masterItem.containerVolumeL;
        
        return {
            masterItem,
            costPerUnit,
            costPerLiter,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      return {
        recipe,
        packagedItems: packagedItemsWithCost,
      };
    }).sort((a,b) => a.recipe.name.localeCompare(b.recipe.name));
  }, [recipes, masterItems, administrationSettings]);

  const filteredData = useMemo(() => {
    if (!searchTerm) {
        return costData;
    }

    const lowercasedTerm = searchTerm.toLowerCase();

    return costData.map(recipeData => {
        const filteredPackagedItems = recipeData.packagedItems.filter(item => 
            item!.masterItem.name.toLowerCase().includes(lowercasedTerm)
        );

        if (filteredPackagedItems.length > 0) {
            return { ...recipeData, packagedItems: filteredPackagedItems };
        }
        return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [searchTerm, costData]);

  const handlePriceChange = (masterItemId: string, value: string) => {
    const newPrice = value === '' ? undefined : parseFloat(value);
    setPrices(prev => ({...prev, [masterItemId]: newPrice}));
  };

  const handleSave = () => {
    const itemsToSave: MasterItem[] = [];
    for (const masterItemId in prices) {
        const originalItem = masterItems.find(item => item.id === masterItemId);
        if (originalItem && originalItem.salePrice !== prices[masterItemId]) {
            itemsToSave.push({ ...originalItem, salePrice: prices[masterItemId] });
        }
    }
    if (itemsToSave.length > 0) {
        onSaveMultipleItems(itemsToSave);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-color-text">{t('Price List Calculator')}</h1>
          <div className="flex items-center gap-4 w-full md:w-auto md:flex-1 md:justify-end">
              <div className="flex-grow max-w-sm">
                  <Input
                    placeholder={t('Search by product name...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <button onClick={handleSave} className="flex-shrink-0 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                  {t('Save Prices')}
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {filteredData.length > 0 ? (
            filteredData.map(({ recipe, packagedItems }) => (
            <Card key={recipe.id} title={recipe.name} icon={<ChartBarIcon className="w-5 h-5"/>}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b-2 border-color-border/50">
                            <tr>
                                <th className="p-2 w-1/3">{t('Finished Product')}</th>
                                <th className="p-2 text-right">{t('Cost per Unit')}</th>
                                <th className="p-2 text-right">{t('Cost per Liter')}</th>
                                <th className="p-2 text-right">{t('Sale Price')}</th>
                                <th className="p-2 text-right">{t('Sale Price per Liter')}</th>
                                <th className="p-2 text-right">{t('Markup %')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-color-border/20">
                            {packagedItems.map(item => {
                                const salePrice = prices[item!.masterItem.id];
                                const markup = (item!.costPerUnit > 0 && salePrice !== undefined) 
                                    ? ((salePrice - item!.costPerUnit) / item!.costPerUnit) * 100 
                                    : null;
                                const salePricePerLiter = (salePrice !== undefined && item!.masterItem.containerVolumeL && item!.masterItem.containerVolumeL > 0)
                                    ? salePrice / item!.masterItem.containerVolumeL
                                    : null;
                                return (
                                    <tr key={item!.masterItem.id}>
                                        <td className="p-2 font-semibold">{item!.masterItem.name}</td>
                                        <td className="p-2 text-right font-mono">{item!.costPerUnit.toFixed(3)} €</td>
                                        <td className="p-2 text-right font-mono">{item!.costPerLiter.toFixed(3)} €</td>
                                        <td className="p-2 text-right">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="text-right font-mono w-28 py-1"
                                                value={salePrice ?? ''}
                                                onChange={(e) => handlePriceChange(item!.masterItem.id, e.target.value)}
                                                unit="€"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-mono">
                                            {salePricePerLiter !== null ? `${salePricePerLiter.toFixed(2)} €` : 'N/A'}
                                        </td>
                                        <td className={`p-2 text-right font-mono font-bold ${markup === null ? '' : markup >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {markup !== null ? `${markup.toFixed(1)}%` : 'N/A'}
                                        </td>
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
  );
};

export default PriceListPage;