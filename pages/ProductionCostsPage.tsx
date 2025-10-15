
import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, MasterItem, AdministrationSettings } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import { ChartBarIcon } from '../components/Icons';

interface ProductionCostsPageProps {
  recipes: Recipe[];
  masterItems: MasterItem[];
  administrationSettings: AdministrationSettings;
  onSaveAdministrationSettings: (settings: AdministrationSettings) => void;
}

const ProductionCostsPage: React.FC<ProductionCostsPageProps> = ({
  recipes,
  masterItems,
  administrationSettings,
  onSaveAdministrationSettings,
}) => {
  const { t } = useTranslation();
  const [currentSettings, setCurrentSettings] = useState(administrationSettings);

  useEffect(() => {
    setCurrentSettings(administrationSettings);
  }, [administrationSettings]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
  };

  const handleSave = () => {
    onSaveAdministrationSettings(currentSettings);
  };
  
  const productCostDetails = useMemo(() => {
    const { 
        annualBatches, annualManpowerCost, annualGasCost, annualRentCost, annualWaterCost,
        annualDetergentsCost, annualCo2Cost, exciseDutyRate
    } = currentSettings;

    const operationalCostsPerBatch = (annualBatches || 0) > 0 
        ? (
            (annualManpowerCost || 0) + 
            (annualGasCost || 0) + 
            (annualRentCost || 0) + 
            (annualWaterCost || 0) +
            (annualDetergentsCost || 0) +
            (annualCo2Cost || 0)
          ) / annualBatches! 
        : 0;

    return recipes.flatMap(recipe => {
        const beerIngredientsCost = [...recipe.mashIngredients, ...recipe.boilWhirlpoolIngredients, ...recipe.tankIngredients]
            .reduce((acc, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                return acc + (ing.quantity * (item?.purchaseCost || 0));
            }, 0);

        const otherRecipeCosts = Object.values(recipe.additionalCosts || {}).reduce((sum: number, cost) => sum + (Number(cost) || 0), 0);
        const packagedLiters = (recipe.qualityControlSpec.liters.target || 0) * ((recipe.processParameters.packagingYield || 0) / 100);
        const exciseDutyPerBatch = (recipe.qualityControlSpec.og.target || 0) * (packagedLiters / 100) * (exciseDutyRate || 0);

        const totalBeerCost = beerIngredientsCost + operationalCostsPerBatch + otherRecipeCosts + exciseDutyPerBatch;

        return recipe.packagedItems.map(packagedItem => {
            const masterItem = masterItems.find(mi => mi.id === packagedItem.masterItemId);
            if (!masterItem) return null;

            const split = (packagedItem.packagingSplit || 0) / 100;
            const costOfBeerForFormat = totalBeerCost * split;
            const litersInFormat = packagedLiters * split;
            
            const packagingMaterialsCost = packagedItem.packagingIngredients.reduce((acc, ing) => {
                const item = masterItems.find(mi => mi.id === ing.masterItemId);
                return acc + (ing.quantity * (item?.purchaseCost || 0));
            }, 0);

            const totalCostForFormat = costOfBeerForFormat + packagingMaterialsCost;
            
            const numberOfUnits = (masterItem.containerVolumeL && masterItem.containerVolumeL > 0) 
                ? litersInFormat / masterItem.containerVolumeL
                : 0;
            
            const costPerUnit = numberOfUnits > 0 ? totalCostForFormat / numberOfUnits : 0;
            const costPerLiter = litersInFormat > 0 ? totalCostForFormat / litersInFormat : 0;
            
            return {
                recipeName: recipe.name,
                productName: masterItem.name,
                beerCost: costOfBeerForFormat,
                packagingCost: packagingMaterialsCost,
                totalCost: totalCostForFormat,
                costPerUnit,
                costPerLiter,
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }).sort((a,b) => a.recipeName.localeCompare(b.recipeName) || a.productName.localeCompare(b.productName));
  }, [recipes, masterItems, currentSettings]);


  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Production Costs')}</h1>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <Card title={t('Annual Cost Settings')} icon={<ChartBarIcon className="w-5 h-5" />}>
          <p className="text-sm text-gray-500 mb-4">{t('Set your global annual costs and total planned batches for the year.')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label={t('Annual Manpower Cost')} name="annualManpowerCost" type="number" value={currentSettings.annualManpowerCost ?? ''} onChange={handleSettingsChange} unit="€" />
            <Input label={t('Annual Gas Cost')} name="annualGasCost" type="number" value={currentSettings.annualGasCost ?? ''} onChange={handleSettingsChange} unit="€" />
            <Input label={t('Annual Rent Cost')} name="annualRentCost" type="number" value={currentSettings.annualRentCost ?? ''} onChange={handleSettingsChange} unit="€" />
            <Input label={t('Annual Water & Wastewater Cost')} name="annualWaterCost" type="number" value={currentSettings.annualWaterCost ?? ''} onChange={handleSettingsChange} unit="€" />
            <Input label={t('Annual Detergents Cost')} name="annualDetergentsCost" type="number" value={currentSettings.annualDetergentsCost ?? ''} onChange={handleSettingsChange} unit="€" />
            <Input label={t('Annual CO2 Cost')} name="annualCo2Cost" type="number" value={currentSettings.annualCo2Cost ?? ''} onChange={handleSettingsChange} unit="€" />
            <Input label={t('Excise Duty Rate')} name="exciseDutyRate" type="number" step="0.001" value={currentSettings.exciseDutyRate ?? ''} onChange={handleSettingsChange} unit="€/hL/°P" />
            <Input label={t('Total Annual Batches')} name="annualBatches" type="number" value={currentSettings.annualBatches ?? ''} onChange={handleSettingsChange} />
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Save Settings')}</button>
          </div>
        </Card>

        <Card title={t('Recipe Cost Summary')}>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b-2 border-color-border/50">
                        <tr>
                            <th className="p-2">{t('Recipe Name')}</th>
                            <th className="p-2">{t('Finished Product')}</th>
                            <th className="p-2 text-right">{t('Beer Cost')}</th>
                            <th className="p-2 text-right">{t('Packaging Cost')}</th>
                            <th className="p-2 text-right">{t('Total Cost')}</th>
                            <th className="p-2 text-right">{t('Cost per Unit')}</th>
                            <th className="p-2 text-right">{t('Cost per Liter')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-color-border/20">
                        {productCostDetails.map(detail => (
                            <tr key={`${detail.recipeName}-${detail.productName}`}>
                                <td className="p-2 font-semibold text-color-secondary">{detail.recipeName}</td>
                                <td className="p-2 font-semibold text-color-accent">{detail.productName}</td>
                                <td className="p-2 text-right font-mono">{detail.beerCost.toFixed(2)} €</td>
                                <td className="p-2 text-right font-mono">{detail.packagingCost.toFixed(2)} €</td>
                                <td className="p-2 text-right font-mono font-bold">{detail.totalCost.toFixed(2)} €</td>
                                <td className="p-2 text-right font-mono font-bold text-color-secondary">{detail.costPerUnit.toFixed(3)} €</td>
                                <td className="p-2 text-right font-mono font-bold text-color-accent">{detail.costPerLiter.toFixed(3)} €</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductionCostsPage;
