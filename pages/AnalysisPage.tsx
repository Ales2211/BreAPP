import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useTranslation } from '../hooks/useTranslation';
// Fix: Add WarehouseItem to the import from ../types.
import { BrewSheet, Recipe, MasterItem, Category, ActualIngredient, ActualBoilWhirlpoolIngredient, ActualTankIngredient, WarehouseItem } from '../types';
import { BeakerIcon, ChartBarIcon, HopsIcon } from '../components/Icons';

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
const BatchComparison: React.FC<{ recipes: Recipe[], batches: BrewSheet[], t: (key: string) => string }> = ({ recipes, batches, t }) => {
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

        const calculateYield = (batch: BrewSheet) => {
            const totalPackagedLiters = batch.packagingLog.packagedItems.reduce((sum, item) => sum + ((item.quantityGood || 0) * (item.formatLiters || 0)), 0);
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
    }, [selectedRecipe, relevantBatches, t]);

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

// Leaderboards Section
const ProductionLeaderboards: React.FC<{ recipes: Recipe[], batches: BrewSheet[], t: (key: string) => string }> = ({ recipes, batches, t }) => {
    const { batchesPerRecipe, volumePerRecipe } = useMemo(() => {
        const batchCounts: { [key: string]: number } = {};
        const volumeCounts: { [key: string]: number } = {};

        batches.forEach(b => {
            batchCounts[b.recipeId] = (batchCounts[b.recipeId] || 0) + 1;
            const totalPackagedLiters = b.packagingLog.packagedItems.reduce((sum, item) => sum + ((item.quantityGood || 0) * (item.formatLiters || 0)), 0);
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
    }, [recipes, batches]);

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

        batch.mashLog.actual.ingredients.forEach(ing => {
            if (ing.lotNumber) {
                results.push({ item: masterItems.find(mi => mi.id === ing.masterItemId), lotNumber: ing.lotNumber, quantity: ing.quantity, stage: t('Mash') });
            }
        });
        batch.boilLog.actual.ingredients.forEach(ing => {
            if (ing.lotNumber) {
                results.push({ item: masterItems.find(mi => mi.id === ing.masterItemId), lotNumber: ing.lotNumber, quantity: ing.quantity, stage: t('Boil') });
            }
        });
        batch.fermentationLog.actual.additions.forEach(ing => {
            if (ing.lotNumber) {
                results.push({ item: masterItems.find(mi => mi.id === ing.masterItemId), lotNumber: ing.lotNumber, quantity: ing.quantity, stage: t('Fermentation') });
            }
        });
        return results;
    }, [selectedBatchId, batches, masterItems, t]);

    const backwardResults = useMemo(() => {
        if (ingredientLotSearch.trim() === '') return [];
        type BackwardResult = { batch: BrewSheet; item: MasterItem; quantity: number, stage: string };
        const results: BackwardResult[] = [];
        const searchTerm = ingredientLotSearch.trim().toLowerCase();
        
        batches.forEach(batch => {
            const checkIngredients = (ingredients: (ActualIngredient | ActualBoilWhirlpoolIngredient | ActualTankIngredient)[], stage: string) => {
                ingredients.forEach(ing => {
                    if (ing.lotNumber && ing.lotNumber.toLowerCase().includes(searchTerm)) {
                        const item = masterItems.find(mi => mi.id === ing.masterItemId);
                        if (item) {
                            results.push({ batch, item, quantity: ing.quantity || 0, stage });
                        }
                    }
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
        batches.forEach(batch => {
            batch.mashLog.actual.ingredients.forEach(ing => ing.lotNumber && lotSet.add(ing.lotNumber));
            batch.boilLog.actual.ingredients.forEach(ing => ing.lotNumber && lotSet.add(ing.lotNumber));
            batch.fermentationLog.actual.additions.forEach(ing => ing.lotNumber && lotSet.add(ing.lotNumber));
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
                <BatchComparison recipes={recipes} batches={batches} t={t} />
                <ProductionLeaderboards recipes={recipes} batches={batches} t={t} />
                <IngredientTraceability batches={batches} masterItems={masterItems} t={t} warehouseItems={warehouseItems} />
            </div>
        </div>
    );
};

export default AnalysisPage;