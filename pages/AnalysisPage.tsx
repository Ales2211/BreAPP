import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useTranslation } from '../hooks/useTranslation';
// Fix: Add WarehouseItem to the import from ../types.
import { BrewSheet, Recipe, MasterItem, Category, ActualIngredient, ActualBoilWhirlpoolIngredient, ActualTankIngredient, WarehouseItem } from '../types';
import { BeakerIcon, ChartBarIcon, HopsIcon, ClipboardCheckIcon } from '../components/Icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface AnalysisPageProps {
    batches: BrewSheet[];
    recipes: Recipe[];
    masterItems: MasterItem[];
    categories: Category[];
    warehouseItems: WarehouseItem[];
}

// Chart Component for Batch Comparison
const ComparisonChart: React.FC<{ title: string; data: ChartData<'bar'>; options: ChartOptions<'bar'> }> = ({ title, data, options }) => (
    <Card title={title}>
        <div className="h-64 md:h-80">
            <Bar data={data} options={options} />
        </div>
    </Card>
);

// New Line Chart Component
const LineChart: React.FC<{ title: string; data: ChartData<'line'>; options: ChartOptions<'line'> }> = ({ title, data, options }) => (
    <Card title={title}>
        <div className="h-64 md:h-80">
            <Line data={data} options={options} />
        </div>
    </Card>
);

// Batch Comparison Section
// Fix: Added masterItems to props to allow for correct packaged volume calculation.
const BatchComparison: React.FC<{ recipes: Recipe[], batches: BrewSheet[], masterItems: MasterItem[], t: (key: string) => string }> = ({ recipes, batches, masterItems, t }) => {
    const [selectedRecipeId, setSelectedRecipeId] = useState(recipes.length > 0 ? recipes[0].id : '');

    const { selectedRecipe, relevantBatches } = useMemo(() => {
        const recipe = recipes.find(r => r.id === selectedRecipeId);
        const filteredBatches = batches
            .filter(b => b.recipeId === selectedRecipeId && b.status === 'Completed')
            .sort((a, b) => new Date(a.cookDate).getTime() - new Date(b.cookDate).getTime());
        return { selectedRecipe: recipe, relevantBatches: filteredBatches };
    }, [selectedRecipeId, recipes, batches]);

    const chartOptions: ChartOptions<'bar'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#495057' } },
            title: { display: false },
        },
        scales: {
            x: { ticks: { color: '#6c757d' }, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
            y: { ticks: { color: '#6c757d' }, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
        },
    }), []);

    const lineChartOptions: ChartOptions<'line'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#495057' } },
            title: { display: false },
        },
        scales: {
            x: { 
                title: { display: true, text: t('Cook Date'), color: '#6c757d'},
                ticks: { color: '#6c757d' }, 
                grid: { color: 'rgba(0, 0, 0, 0.1)' } 
            },
            y: { 
                title: { display: true, text: t('Yield (%)'), color: '#6c757d'},
                ticks: { color: '#6c757d' }, 
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                suggestedMin: 70,
                suggestedMax: 100
            },
        },
    }), [t]);

    const chartData = useMemo(() => {
        if (!selectedRecipe || relevantBatches.length === 0) return null;
        const labels = relevantBatches.map(b => b.lot);

        const ogData = {
            labels,
            datasets: [
                { type: 'bar' as const, label: t('Actual OG (°P)'), data: relevantBatches.map(b => b.boilLog.actual.postBoilPlato), backgroundColor: 'rgba(13, 110, 253, 0.6)' },
                { type: 'line' as const, label: t('Target OG (°P)'), data: Array(labels.length).fill(selectedRecipe.qualityControlSpec.og.target), borderColor: '#fd7e14', borderWidth: 2, pointRadius: 0 }
            ]
        };
        const fgData = {
            labels,
            datasets: [
                { type: 'bar' as const, label: t('Actual FG (°P)'), data: relevantBatches.map(b => b.fermentationLog.actual.logEntries[b.fermentationLog.actual.logEntries.length-1]?.gravity || 0), backgroundColor: 'rgba(13, 110, 253, 0.6)' },
                { type: 'line' as const, label: t('Target FG (°P)'), data: Array(labels.length).fill(selectedRecipe.qualityControlSpec.fg.target), borderColor: '#fd7e14', borderWidth: 2, pointRadius: 0 }
            ]
        };
        // Fix: Corrected yield calculation by looking up containerVolumeL from the masterItem.
        const calculateYield = (batch: BrewSheet) => {
            const totalPackagedLiters = batch.packagingLog.packagedItems.reduce((sum, item) => {
                const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                const volume = masterItem?.containerVolumeL || 0;
                return sum + ((item.quantityGood || 0) * volume);
            }, 0);
            const expectedLiters = batch.packagingLog.summaryExpectedLiters || 1;
            return (totalPackagedLiters / expectedLiters) * 100;
        };

        const yieldData = {
            labels,
            datasets: [ { label: t('Analysis_Page_Total_Yield') + ' (%)', data: relevantBatches.map(calculateYield), backgroundColor: 'rgba(25, 135, 84, 0.6)' } ]
        };

        const yieldOverTimeData = {
            labels: relevantBatches.map(b => b.cookDate),
            datasets: [
                {
                    label: t('Yield Trend (%)'),
                    data: relevantBatches.map(calculateYield),
                    borderColor: 'rgba(25, 135, 84, 1)',
                    backgroundColor: 'rgba(25, 135, 84, 0.2)',
                    fill: true,
                    tension: 0.2,
                    pointBackgroundColor: 'rgba(25, 135, 84, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                    pointRadius: 5,
                }
            ]
        };
        
        return { ogData, fgData, yieldData, yieldOverTimeData };
    }, [selectedRecipe, relevantBatches, t, masterItems]);

    return (
        <Card title={t('Batch Comparison')} icon={<ChartBarIcon className="w-5 h-5"/>}>
            <div className="mb-4">
                <Select containerClassName="w-full md:w-1/2" label={t('Select Recipe to Compare')} value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)}>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
            </div>
            {chartData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ComparisonChart title={t('Original Gravity (OG)')} data={chartData.ogData} options={chartOptions} />
                    <ComparisonChart title={t('Final Gravity (FG)')} data={chartData.fgData} options={chartOptions} />
                    <ComparisonChart title={t('Analysis_Page_Total_Yield')} data={chartData.yieldData} options={{...chartOptions, scales: {...chartOptions.scales, y: {...chartOptions.scales?.y, suggestedMax: 100}}}} />
                    <LineChart title={t('Yield Trend (%)')} data={chartData.yieldOverTimeData} options={lineChartOptions} />
                </div>
            ) : <p className="text-gray-500">{t('No completed batches found for this recipe.')}</p>}
        </Card>
    );
};

// Parameter Range Analysis Section
// Fix: Added masterItems to props to allow for correct packaged volume calculation.
const ParameterRangeAnalysis: React.FC<{ recipes: Recipe[], batches: BrewSheet[], masterItems: MasterItem[], t: (key: string) => string }> = ({ recipes, batches, masterItems, t }) => {
    const [selectedRecipeId, setSelectedRecipeId] = useState(recipes.length > 0 ? recipes[0].id : '');

    const analysisResults = useMemo(() => {
        const recipe = recipes.find(r => r.id === selectedRecipeId);
        if (!recipe) return [];

        const completedBatches = batches.filter(b => b.recipeId === selectedRecipeId && b.status === 'Completed');
        if (completedBatches.length === 0) return [];

        const getNumericValues = (path: string, batches: BrewSheet[]): number[] => {
            return batches.map(batch => {
                let value: any;
                if (path.includes('[last]')) {
                    const [basePath, prop] = path.split('[last].');
                    const logEntries: any[] = basePath.split('.').reduce((obj, key) => obj?.[key], batch);
                    if (logEntries && logEntries.length > 0) {
                        for (let i = logEntries.length - 1; i >= 0; i--) {
                            if (logEntries[i][prop] !== null && logEntries[i][prop] !== undefined) {
                                value = logEntries[i][prop];
                                break;
                            }
                        }
                    }
                } else {
                    value = path.split('.').reduce((obj, key) => obj?.[key], batch);
                }
                const num = Number(value);
                return isNaN(num) ? null : num;
            }).filter((v): v is number => v !== null);
        };
        
        // Fix: Corrected packaged liters calculation by looking up containerVolumeL from the masterItem.
        const getPackagedLiters = (batch: BrewSheet): number => {
            return batch.packagingLog.packagedItems.reduce((sum, item) => {
                const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                const volume = masterItem?.containerVolumeL || 0;
                return sum + ((item.quantityGood || 0) * volume);
            }, 0);
        }

        const parameters = [
            { name: t('OG'), path: 'boilLog.actual.postBoilPlato', spec: recipe.qualityControlSpec.og, unit: '°P' },
            { name: t('FG'), path: 'fermentationLog.actual.logEntries[last].gravity', spec: recipe.qualityControlSpec.fg, unit: '°P' },
            { name: t('Packaged Liters (lt)'), path: 'packagingLog.packagedItems', spec: recipe.qualityControlSpec.liters, unit: 'L', customFunc: getPackagedLiters },
            { name: t('Final pH'), path: 'fermentationLog.actual.logEntries[last].ph', spec: recipe.qualityControlSpec.finalPh, unit: '' },
            { name: t('Mash pH'), path: 'mashLog.actual.mashPh', spec: {target: recipe.processParameters.expectedMashPh, min: recipe.processParameters.expectedMashPh - 0.1, max: recipe.processParameters.expectedMashPh + 0.1}, unit: '' },
            { name: t('Pre-Boil (°P)'), path: 'boilLog.actual.preBoilPlato', spec: {target: recipe.processParameters.preBoilPlato}, unit: '°P' },
        ];

        return parameters.map(param => {
            const values = param.customFunc 
                ? completedBatches.map(param.customFunc).filter(v => !isNaN(v)) 
                : getNumericValues(param.path, completedBatches);
            
            if (values.length === 0) return null;

            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            
            const specMin = param.spec?.min ?? param.spec?.target;
            const specMax = param.spec?.max ?? param.spec?.target;
            
            const isInSpec = (specMin !== undefined && specMax !== undefined) ? (avg >= specMin && avg <= specMax) : true;

            return {
                name: param.name,
                spec: `${param.spec?.target?.toFixed(2) ?? 'N/A'} ${param.unit}`,
                avg: `${avg.toFixed(2)} ${param.unit}`,
                deviation: param.spec?.target ? `${((avg - param.spec.target) / param.spec.target * 100).toFixed(1)}%` : 'N/A',
                isInSpec
            };
        }).filter(Boolean);

    }, [selectedRecipeId, recipes, batches, t, masterItems]);

    return (
        <Card title={t('Quality Control Analysis')} icon={<ClipboardCheckIcon className="w-5 h-5"/>}>
            <div className="mb-4">
                <Select containerClassName="w-full md:w-1/2" label={t('Select Recipe to Compare')} value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)}>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
            </div>
            {analysisResults.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b-2 border-color-border/50">
                            <tr>
                                <th className="p-2">{t('Parameter')}</th>
                                <th className="p-2 text-right">{t('Specification')}</th>
                                <th className="p-2 text-right">{t('Actual (Avg)')}</th>
                                <th className="p-2 text-right">{t('Deviation')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-color-border/20">
                            {analysisResults.map(result => (
                                <tr key={result!.name}>
                                    <td className="p-2 font-semibold">{result!.name}</td>
                                    <td className="p-2 text-right font-mono">{result!.spec}</td>
                                    <td className={`p-2 text-right font-mono font-bold ${result!.isInSpec ? 'text-green-500' : 'text-red-500'}`}>
                                        {result!.avg}
                                    </td>
                                    <td className={`p-2 text-right font-mono ${result!.isInSpec ? 'text-green-500' : 'text-red-500'}`}>
                                        {result!.deviation}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="text-gray-500">{t('No completed batches found for this recipe.')}</p>}
        </Card>
    );
};


// Leaderboards Section
// Fix: Added masterItems to props to allow for correct packaged volume calculation.
const ProductionLeaderboards: React.FC<{ recipes: Recipe[], batches: BrewSheet[], masterItems: MasterItem[], t: (key: string) => string }> = ({ recipes, batches, masterItems, t }) => {
    const { batchesPerRecipe, volumePerRecipe } = useMemo(() => {
        const batchCounts: { [key: string]: number } = {};
        const volumeCounts: { [key: string]: number } = {};

        batches.forEach(b => {
            batchCounts[b.recipeId] = (batchCounts[b.recipeId] || 0) + 1;
            // Fix: Corrected packaged liters calculation by looking up containerVolumeL from the masterItem.
            const totalPackagedLiters = b.packagingLog.packagedItems.reduce((sum, item) => {
                const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                const volume = masterItem?.containerVolumeL || 0;
                return sum + ((item.quantityGood || 0) * volume);
            }, 0);
            volumeCounts[b.recipeId] = (volumeCounts[b.recipeId] || 0) + totalPackagedLiters;
        });

        const sortedBatchCounts = Object.entries(batchCounts)
            .map(([recipeId, count]) => ({ recipe: recipes.find(r => r.id === recipeId), count }))
            .filter(item => item.recipe)
            .sort((a, b) => b.count - a.count);

        const sortedVolumeCounts = Object.entries(volumeCounts)
            .map(([recipeId, volume]) => ({ recipe: recipes.find(r => r.id === recipeId), volume }))
            .filter(item => item.recipe)
            .sort((a, b) => b.volume - a.volume);
            
        return { batchesPerRecipe: sortedBatchCounts, volumePerRecipe: sortedVolumeCounts };
    }, [recipes, batches, masterItems]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={t('Most Brewed Recipes')}>
                <ol className="list-decimal list-inside space-y-2">
                    {batchesPerRecipe.map(({ recipe, count }) => (
                        <li key={recipe!.id} className="text-color-text">
                            <span className="font-semibold text-color-accent">{recipe!.name}</span> - {count} {t('Batches').toLowerCase()}
                        </li>
                    ))}
                </ol>
            </Card>
            <Card title={t('Analysis_Top_Volume_Recipes')}>
                <ol className="list-decimal list-inside space-y-2">
                    {volumePerRecipe.map(({ recipe, volume }) => (
                        <li key={recipe!.id} className="text-color-text">
                            <span className="font-semibold text-color-accent">{recipe!.name}</span> - {volume.toFixed(2)} L
                        </li>
                    ))}
                </ol>
            </Card>
        </div>
    );
};

// Traceability Section
const IngredientTraceability: React.FC<{ batches: BrewSheet[], masterItems: MasterItem[], t: (key: string) => string, warehouseItems: WarehouseItem[] }> = ({ batches, masterItems, t, warehouseItems }) => {
    const [mode, setMode] = useState<'forward' | 'backward'>('forward');
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [selectedBatch, setSelectedBatch] = useState<BrewSheet | null>(null);
    const [ingredientLotSearch, setIngredientLotSearch] = useState('');

    const forwardResults = useMemo(() => {
        if (!selectedBatchId) return [];
        const batch = batches.find(b => b.id === selectedBatchId);
        if (!batch) return [];

        type ForwardResult = {
            item?: MasterItem;
            lotNumber?: string;
            quantity?: number;
            stage: string;
        };
        const results: ForwardResult[] = [];

        // Fix: Updated to iterate through lotAssignments array.
        const processIngredients = (ingredients: ActualIngredient[], stage: string) => {
            ingredients.forEach(ing => {
                ing.lotAssignments.forEach(assignment => {
                    if (assignment.lotNumber && assignment.quantity > 0) {
                        results.push({
                            item: masterItems.find(mi => mi.id === ing.masterItemId),
                            lotNumber: assignment.lotNumber,
                            quantity: assignment.quantity,
                            stage
                        });
                    }
                });
            });
        };

        processIngredients(batch.mashLog.actual.ingredients, t('Mash'));
        processIngredients(batch.boilLog.actual.ingredients, t('Boil'));
        processIngredients(batch.fermentationLog.actual.additions, t('Fermentation'));
        
        return results;
    }, [selectedBatchId, batches, masterItems, t]);

    const backwardResults = useMemo(() => {
        if (ingredientLotSearch.trim() === '') return [];
        type BackwardResult = { batch: BrewSheet; item: MasterItem; quantity: number, stage: string };
        const results: BackwardResult[] = [];
        const searchTerm = ingredientLotSearch.trim().toLowerCase();
        
        batches.forEach(batch => {
            // Fix: Updated to iterate through lotAssignments array.
            const checkIngredients = (ingredients: (ActualIngredient | ActualBoilWhirlpoolIngredient | ActualTankIngredient)[], stage: string) => {
                ingredients.forEach(ing => {
                    ing.lotAssignments.forEach(assignment => {
                        if (assignment.lotNumber && assignment.lotNumber.toLowerCase().includes(searchTerm)) {
                            const item = masterItems.find(mi => mi.id === ing.masterItemId);
                            if (item) {
                                results.push({ batch, item, quantity: assignment.quantity, stage });
                            }
                        }
                    });
                });
            };
            checkIngredients(batch.mashLog.actual.ingredients, t('Mash'));
            checkIngredients(batch.boilLog.actual.ingredients, t('Boil'));
            checkIngredients(batch.fermentationLog.actual.additions, t('Fermentation'));
        });
        return results;
    }, [ingredientLotSearch, batches, masterItems, t]);

    const uniqueLots = useMemo(() => {
        const lotSet = new Set<string>();
        warehouseItems.forEach(item => lotSet.add(item.lotNumber));
        // Fix: Updated to iterate through lotAssignments array.
        batches.forEach(batch => {
            batch.mashLog.actual.ingredients.forEach(ing => ing.lotAssignments.forEach(a => a.lotNumber && lotSet.add(a.lotNumber)));
            batch.boilLog.actual.ingredients.forEach(ing => ing.lotAssignments.forEach(a => a.lotNumber && lotSet.add(a.lotNumber)));
            batch.fermentationLog.actual.additions.forEach(ing => ing.lotAssignments.forEach(a => a.lotNumber && lotSet.add(a.lotNumber)));
        });
        return Array.from(lotSet).sort();
    }, [warehouseItems, batches]);

    const handleBatchSelection = (batchId: string) => {
        setSelectedBatchId(batchId);
        const batch = batches.find(b => b.id === batchId);
        setSelectedBatch(batch || null);
    };

    return (
        <Card title={t('Ingredient Traceability')} icon={<HopsIcon className="w-5 h-5"/>}>
            <div className="flex space-x-2 mb-4 border-b border-color-border">
                <button onClick={() => setMode('forward')} className={`py-2 px-4 text-sm font-semibold ${mode === 'forward' ? 'text-color-accent border-b-2 border-color-accent' : 'text-gray-600'}`}>{t('Batch to Ingredients')}</button>
                <button onClick={() => setMode('backward')} className={`py-2 px-4 text-sm font-semibold ${mode === 'backward' ? 'text-color-accent border-b-2 border-color-accent' : 'text-gray-600'}`}>{t('Ingredient to Batches')}</button>
            </div>
            {mode === 'forward' ? (
                <div>
                    <Select containerClassName="w-full md:w-1/2" label={t('Select Batch')} value={selectedBatchId} onChange={e => handleBatchSelection(e.target.value)}>
                        <option value="">{t('Select a batch...')}</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.beerName} - {b.lot}</option>)}
                    </Select>
                    {selectedBatch && (
                         <div className="bg-color-background p-3 rounded-md my-4">
                            <h3 className="font-bold text-color-text">{selectedBatch.beerName} - {selectedBatch.lot}</h3>
                            <p className="text-sm text-gray-500">{t('Cook Date')}: {selectedBatch.cookDate}</p>
                         </div>
                    )}
                    {forwardResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                           {forwardResults.map((r, i) => (
                               <div key={i} className="flex justify-between items-center bg-color-background p-2 rounded-md border border-color-border/20">
                                   <div>
                                       <p className="font-semibold">{r.item?.name}</p>
                                       <p className="text-xs text-gray-500">{t('Stage')}: {r.stage}</p>
                                   </div>
                                   <div className="text-right">
                                       <p className="font-mono text-color-accent">{r.lotNumber}</p>
                                       <p className="text-xs text-gray-500">{r.quantity?.toFixed(2)} {r.item?.unit}</p>
                                   </div>
                               </div>
                           ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <Input
                        label={t('Search Ingredient Lot')}
                        value={ingredientLotSearch}
                        onChange={e => setIngredientLotSearch(e.target.value)}
                        placeholder={t('Enter lot number...')}
                        list="lot-numbers"
                    />
                     <datalist id="lot-numbers">
                        {uniqueLots.map(lot => <option key={lot} value={lot} />)}
                    </datalist>
                    {backwardResults.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {backwardResults.map((r, i) => (
                                <div key={i} className="bg-color-background p-3 rounded-md border border-color-border/50 hover:border-color-accent/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-color-accent">{r.batch.beerName} - {r.batch.lot}</p>
                                            <p className="text-sm text-gray-400">{r.batch.cookDate}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{r.item.name}</p>
                                            <p className="text-sm text-gray-400">
                                                {t('Used')}: <span className="font-mono">{r.quantity.toFixed(2)} {r.item.unit}</span> ({r.stage})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};


const AnalysisPage: React.FC<AnalysisPageProps> = ({ batches, recipes, masterItems, categories, warehouseItems }) => {
    const { t } = useTranslation();
    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Analysis')}</h1>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <BatchComparison recipes={recipes} batches={batches} masterItems={masterItems} t={t} />
                <ParameterRangeAnalysis recipes={recipes} batches={batches} masterItems={masterItems} t={t} />
                <ProductionLeaderboards recipes={recipes} batches={batches} masterItems={masterItems} t={t} />
                <IngredientTraceability batches={batches} masterItems={masterItems} t={t} warehouseItems={warehouseItems} />
            </div>
        </div>
    );
};

export default AnalysisPage;