import React, { useMemo } from 'react';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { BrewSheet, WarehouseItem, MasterItem, Page } from '../types';
import { BeakerIcon, CalendarIcon, ArchiveIcon, ArrowRightIcon, HopsIcon, SnowflakeIcon, BottleIcon, AlertTriangleIcon } from '../components/Icons';

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
                        task: step.description,
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
                            task: `${t('Dry Hop')}: ${masterItem.name}`,
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

const LowStockAlerts: React.FC<{
    lowStockItems: (MasterItem & { currentStock: number })[];
    onNavigate: (page: Page) => void;
    t: (key: string) => string;
}> = ({ lowStockItems, onNavigate, t }) => {
    return (
        <Card className="flex-1 flex flex-col" bodyClassName="flex flex-col">
            <h2 className="text-xl text-color-accent font-semibold mb-4">{t('Low Stock Alerts')}</h2>
            {lowStockItems.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                        <ArchiveIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <p className="mt-2 text-gray-500">{t('All items are well-stocked.')}</p>
                    </div>
                </div>
            ) : (
                 <ul className="space-y-3 overflow-y-auto pr-2 -mr-2">
                    {lowStockItems.map(item => (
                        <li key={item.id} className="w-full flex items-center space-x-3 p-3 bg-color-background rounded-md">
                            <div className="flex-shrink-0"><AlertTriangleIcon className="w-5 h-5 text-red-400" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-color-text truncate">{item.name}</p>
                                <p className="text-sm text-gray-500 truncate">{t('Stock')}: {item.currentStock.toFixed(2)} / {item.reorderPoint} {item.unit}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}


interface DashboardPageProps {
    batches: BrewSheet[];
    warehouseItems: WarehouseItem[];
    masterItems: MasterItem[];
    onNavigate: (page: Page | { page: Page; id: string }) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ batches, warehouseItems, masterItems, onNavigate }) => {
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
        
        const completedBatches = batches.filter(b => b.status === 'Completed' && b.packagingLog.summaryExpectedLiters && b.packagingLog.summaryExpectedLiters > 0);
        const totalYield = completedBatches.reduce((sum, batch) => {
            const totalPackagedLiters = batch.packagingLog.packagedItems.reduce((s, packagedItem) => {
                const masterItem = masterItems.find(mi => mi.id === packagedItem.masterItemId);
                const volume = masterItem?.containerVolumeL || 0;
                return s + ((packagedItem.quantityGood || 0) * volume);
            }, 0);
            const expectedLiters = batch.packagingLog.summaryExpectedLiters || 1; // Avoid division by zero
            return sum + (totalPackagedLiters / expectedLiters);
        }, 0);
        const averageYield = completedBatches.length > 0 ? (totalYield / completedBatches.length) * 100 : 0;
        
        return { inProgress, planned, lowStockItems, averageYield };
    }, [batches, warehouseItems, masterItems]);

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Dashboard')}</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
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
                 <StatCard 
                    icon={<BottleIcon className="w-6 h-6 text-green-400" />}
                    title={t('Average Packaging Yield')}
                    value={`${stats.averageYield.toFixed(1)}%`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                <ActivityAlerts batches={batches} masterItems={masterItems} onNavigate={onNavigate} t={t} />
                <LowStockAlerts lowStockItems={stats.lowStockItems} onNavigate={onNavigate} t={t} />
            </div>
        </div>
    )
};

export default DashboardPage;