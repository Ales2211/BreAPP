
import React, { useMemo } from 'react';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { BrewSheet, WarehouseItem, MasterItem, Page, Recipe, Location } from '../types';
import { BeakerIcon, CalendarIcon, ArchiveIcon, ArrowRightIcon, HopsIcon, SnowflakeIcon, BottleIcon, AlertTriangleIcon, ChartBarIcon } from '../components/Icons';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions, ChartData } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    actionText?: string;
    onActionClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, actionText, onActionClick }) => {
    return (
        <Card className="flex flex-col">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-color-background rounded-md">
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="text-2xl font-bold text-color-text">{value}</p>
                    </div>
                </div>
            </div>
            {actionText && onActionClick && (
                <button onClick={onActionClick} className="mt-4 text-sm font-semibold text-color-accent flex items-center space-x-1 self-start hover:underline">
                    <span>{actionText}</span>
                    <ArrowRightIcon className="w-4 h-4" />
                </button>
            )}
        </Card>
    );
};

type ActivityAlert = {
    batch: BrewSheet;
    task: string;
    date: Date;
    type: 'hop' | 'step' | 'package';
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const ActivityAlerts: React.FC<{
    batches: BrewSheet[];
    masterItems: MasterItem[];
    onNavigate: (page: { page: Page, id: string }) => void;
    t: (key: string) => string;
}> = ({ batches, masterItems, onNavigate, t }) => {
    
    const alerts = useMemo((): ActivityAlert[] => {
        const relevantAlerts: ActivityAlert[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = addDays(new Date(today), 7);

        const activeBatches = batches.filter(b => ['In Progress', 'Fermenting'].includes(b.status));

        activeBatches.forEach(batch => {
            const cookDate = new Date(`${batch.cookDate}T00:00:00`);

            const isDateRelevant = (date: Date) => date <= sevenDaysFromNow;

            // 1. Fermentation Step Alerts
            let cumulativeDays = 0;
            batch.fermentationLog.expected.steps.forEach(step => {
                const stepDate = addDays(cookDate, cumulativeDays);
                if (isDateRelevant(stepDate)) {
                    relevantAlerts.push({
                        batch,
                        task: `${step.description} @ ${step.temperature}°C`,
                        date: stepDate,
                        type: 'step'
                    });
                }
                cumulativeDays += step.days;
            });

            // 2. Dry Hop Alerts
            batch.fermentationLog.expected.additions.forEach(addition => {
                const masterItem = masterItems.find(mi => mi.id === addition.masterItemId);
                if (masterItem?.categoryId === 'cat_hops') {
                    const additionDate = addDays(cookDate, addition.day);
                     if (isDateRelevant(additionDate)) {
                        relevantAlerts.push({
                            batch,
                            task: `${t('Dry Hop')}: ${addition.quantity} ${masterItem.unit} ${masterItem.name}`,
                            date: additionDate,
                            type: 'hop'
                        });
                    }
                }
            });
            
            // 3. Packaging Alert
            const totalFermentationDays = batch.fermentationLog.expected.steps.reduce((sum, step) => sum + step.days, 0);
            const packagingDate = addDays(cookDate, totalFermentationDays);
            if (isDateRelevant(packagingDate)) {
                 relevantAlerts.push({
                    batch,
                    task: t('Ready for Packaging'),
                    date: packagingDate,
                    type: 'package'
                });
            }
        });

        return relevantAlerts.sort((a, b) => a.date.getTime() - b.date.getTime());

    }, [batches, masterItems, t]);

    const getRelativeDateString = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alertDate = new Date(date);
        alertDate.setHours(0, 0, 0, 0);

        const diffTime = alertDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            const daysAgo = Math.abs(diffDays);
            return <span className="text-red-500 font-bold">{t('Overdue by')} {daysAgo} {daysAgo === 1 ? t('day') : t('days')}</span>;
        }
        if (diffDays === 0) {
            return <span className="text-yellow-500 font-bold">{t('Due Today')}</span>;
        }
        return <span className="text-gray-400">{t('Due in')} {diffDays} {diffDays === 1 ? t('day') : t('days')}</span>;
    };
    
    const getIconForType = (type: ActivityAlert['type'], task: string) => {
        switch(type) {
            case 'hop': return <HopsIcon className="w-5 h-5 text-green-400" />;
            case 'step': 
                if (task.toLowerCase().includes('crash')) {
                    return <SnowflakeIcon className="w-5 h-5 text-sky-400" />;
                }
                return <BeakerIcon className="w-5 h-5 text-purple-400" />;
            case 'package': return <BottleIcon className="w-5 h-5 text-orange-400" />;
            default: return <BeakerIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
         <Card className="flex-1 flex flex-col" bodyClassName="flex flex-col">
            <h2 className="text-xl text-color-accent font-semibold mb-4">{t('Batch Activity Alerts')}</h2>
            {alerts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                        <BeakerIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <p className="mt-2 text-gray-500">{t('All clear! No immediate actions required.')}</p>
                    </div>
                </div>
            ) : (
                <ul className="space-y-3 overflow-y-auto pr-2 -mr-2">
                    {alerts.map((alert, index) => (
                        <li key={`${alert.batch.id}-${index}`}>
                            <button 
                                onClick={() => onNavigate({ page: Page.Batches, id: alert.batch.id })}
                                className="w-full flex items-center space-x-3 p-3 bg-color-background rounded-md hover:bg-color-border/50 transition-colors text-left"
                            >
                                <div className="flex-shrink-0">{getIconForType(alert.type, alert.task)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-color-text truncate">{alert.task}</p>
                                    <p className="text-sm text-gray-500 truncate">{alert.batch.beerName} - {t('Lot')}: {alert.batch.lot}</p>
                                </div>
                                <div className="text-sm text-right flex-shrink-0">
                                    {getRelativeDateString(alert.date)}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};

const statusColors: { [key in BrewSheet['status']]: string } = {
    'Planned': 'border-blue-500',
    'In Progress': 'border-yellow-500',
    'Fermenting': 'border-purple-500',
    'Packaged': 'border-green-500',
    'Completed': 'border-gray-500',
};

const TankStatusOverview: React.FC<{
    batches: BrewSheet[];
    recipes: Recipe[];
    locations: Location[];
    onNavigate: (page: { page: Page, id: string }) => void;
    t: (key: string) => string;
}> = ({ batches, recipes, locations, onNavigate, t }) => {
    const tanks = useMemo(() => locations.filter(l => l.type === 'Tank').sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true })), [locations]);

    const tankOccupancy = useMemo(() => {
        const occupancyMap = new Map<string, BrewSheet>();
        const activeBatches = batches.filter(b => ['In Progress', 'Fermenting'].includes(b.status));
        activeBatches.forEach(batch => {
            occupancyMap.set(batch.fermenterId, batch);
        });
        return occupancyMap;
    }, [batches]);

    return (
        <Card className="flex-1 flex flex-col" bodyClassName="flex flex-col">
            <h2 className="text-xl text-color-accent font-semibold mb-4">{t('Tank Status')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 -mr-2">
                {tanks.map(tank => {
                    const batch = tankOccupancy.get(tank.id);

                    if (!batch) {
                        return (
                            <div key={tank.id} className="p-3 bg-color-background rounded-lg border border-dashed border-color-border">
                                <h3 className="font-bold text-gray-600">{tank.name}</h3>
                                <p className="text-sm text-gray-400">{t('Empty')}</p>
                            </div>
                        );
                    }
                    
                    const recipe = recipes.find(r => r.id === batch.recipeId);
                    const cookDate = new Date(`${batch.cookDate}T00:00:00`);
                    const today = new Date();
                    const dayInFerm = Math.floor((today.getTime() - cookDate.getTime()) / (1000 * 3600 * 24));
                    
                    let currentStep = null;
                    let dayInStep = 0;
                    let cumulativeDays = 0;
                    if(recipe) {
                        for(const step of recipe.fermentationSteps) {
                            if (dayInFerm >= cumulativeDays && dayInFerm < cumulativeDays + step.days) {
                                currentStep = step;
                                dayInStep = dayInFerm - cumulativeDays + 1;
                                break;
                            }
                            cumulativeDays += step.days;
                        }
                    }
                    const progress = currentStep ? (dayInStep / currentStep.days) * 100 : 0;

                    return (
                        <button key={tank.id} onClick={() => onNavigate({ page: Page.Batches, id: batch.id })} className={`p-3 bg-color-surface rounded-lg shadow-md border-l-4 ${statusColors[batch.status]} text-left`}>
                            <h3 className="font-bold text-color-text truncate">{tank.name}</h3>
                            <p className="text-sm font-semibold text-color-accent truncate">{batch.beerName}</p>
                            <p className="text-xs text-gray-500 truncate">{t('Lot')}: {batch.lot}</p>
                            {currentStep && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 truncate">{currentStep.description}</p>
                                    <p className="text-xs font-semibold">{t('Day')} {dayInStep} {t('of')} {currentStep.days}</p>
                                    <div className="w-full bg-color-border rounded-full h-1.5 mt-1">
                                        <div className="bg-color-accent h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </Card>
    );
};

const ProductionVolumeChart: React.FC<{
    batches: BrewSheet[];
    masterItems: MasterItem[];
    t: (key: string) => string;
}> = ({ batches, masterItems, t }) => {
    
    const chartData = useMemo<ChartData<'bar'>>(() => {
        const months: string[] = [];
        const data: number[] = [];
        const today = new Date();

        for(let i=5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(date.toLocaleString('default', { month: 'short' }));
            data.push(0);
        }
        
        const completedBatches = batches.filter(b => (b.status === 'Completed' || b.status === 'Packaged') && b.packagingLog.packagingDate);

        completedBatches.forEach(batch => {
            const packagingDate = new Date(batch.packagingLog.packagingDate!);
            const monthDiff = (today.getFullYear() - packagingDate.getFullYear()) * 12 + (today.getMonth() - packagingDate.getMonth());
            
            if (monthDiff >= 0 && monthDiff < 6) {
                const totalPackagedLiters = batch.packagingLog.packagedItems.reduce((sum, packagedItem) => {
                    const masterItem = masterItems.find(mi => mi.id === packagedItem.masterItemId);
                    const volume = masterItem?.containerVolumeL || 0;
                    return sum + ((packagedItem.quantityGood || 0) * volume);
                }, 0);
                
                const index = 5 - monthDiff;
                data[index] += totalPackagedLiters;
            }
        });

        return {
            labels: months,
            datasets: [{
                label: t('Volume (L)'),
                data: data,
                backgroundColor: 'rgba(13, 110, 253, 0.6)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1
            }]
        };
    }, [batches, masterItems, t]);

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    return (
        <Card title={t('Monthly Production Volume')} icon={<ChartBarIcon className="w-5 h-5"/>}>
            <div className="h-64">
                <Bar data={chartData} options={chartOptions} />
            </div>
        </Card>
    );
};


interface DashboardPageProps {
    batches: BrewSheet[];
    warehouseItems: WarehouseItem[];
    masterItems: MasterItem[];
    recipes: Recipe[];
    locations: Location[];
    onNavigate: (page: Page | { page: Page; id: string }) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ batches, warehouseItems, masterItems, recipes, locations, onNavigate }) => {
    const { t } = useTranslation();

    const stats = useMemo(() => {
        const inProgress = batches.filter(b => ['In Progress', 'Fermenting'].includes(b.status)).length;
        const planned = batches.filter(b => b.status === 'Planned').length;

        const stock = new Map<string, number>();
        warehouseItems.forEach(item => {
            stock.set(item.masterItemId, (stock.get(item.masterItemId) || 0) + item.quantity);
        });

        const lowStockItems = masterItems
            .map(mi => ({ ...mi, currentStock: stock.get(mi.id) || 0 }))
            .filter(mi => {
                if (mi.reorderPoint === undefined || mi.reorderPoint === null) return false;
                return mi.currentStock < mi.reorderPoint;
            });
        
        return { inProgress, planned, lowStockItems };
    }, [batches, warehouseItems, masterItems]);

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-color-text mb-4 flex-shrink-0">{t('Dashboard')}</h1>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard 
                        icon={<BeakerIcon className="w-6 h-6 text-color-secondary" />}
                        title={t('Batches in Progress')}
                        value={stats.inProgress}
                        actionText={t('View Batches')}
                        onActionClick={() => onNavigate(Page.Batches)}
                    />
                     <StatCard 
                        icon={<CalendarIcon className="w-6 h-6 text-color-accent" />}
                        title={t('Planned Batches')}
                        value={stats.planned}
                        actionText={t('View Calendar')}
                        onActionClick={() => onNavigate(Page.Calendar)}
                    />
                     <StatCard 
                        icon={<ArchiveIcon className="w-6 h-6 text-red-400" />}
                        title={t('Low Stock Items')}
                        value={stats.lowStockItems.length}
                        actionText={t('View Warehouse')}
                        onActionClick={() => onNavigate(Page.Warehouse)}
                    />
                    <ProductionVolumeChart batches={batches} masterItems={masterItems} t={t} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <TankStatusOverview batches={batches} recipes={recipes} locations={locations} onNavigate={onNavigate} t={t} />
                    </div>
                    <div className="flex flex-col gap-6">
                        <ActivityAlerts batches={batches} masterItems={masterItems} onNavigate={onNavigate} t={t} />
                    </div>
                </div>
            </div>
        </div>
    )
};

export default DashboardPage;
