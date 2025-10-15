

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BrewSheet, Recipe, Location, MasterItem, Category, LogEntry } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { HopsIcon, MashTunIcon, SnowflakeIcon, ThermometerIcon, ArrowLeftIcon, ArrowRightIcon, BottleIcon, PlusCircleIcon } from '../components/Icons';
import CreateBatchModal from '../components/CreateBatchModal';
import ChangeTankModal from '../components/ChangeTankModal';

// Helper functions for date manipulation
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getISODateString = (date: Date): string => {
    // Use local date parts to avoid timezone shifts from toISOString()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const dayOfWeek = (date: Date, locale: string) => {
    return date.toLocaleDateString(locale, { weekday: 'short' }).charAt(0).toUpperCase();
}

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

interface BrewPlannerPageProps {
  batches: BrewSheet[];
  recipes: Recipe[];
  locations: Location[];
  masterItems: MasterItem[];
  categories: Category[];
  onSelectBatch: (batch: BrewSheet) => void;
  onCreateBatch: (recipeId: string, details: { cookDate: string; fermenterId: string; }) => void;
}

const BrewPlannerPage: React.FC<BrewPlannerPageProps> = ({ batches, recipes, locations, masterItems, categories, onSelectBatch, onCreateBatch }) => {
    const { t, language } = useTranslation();
    const [startDate, setStartDate] = useState(() => addDays(new Date(), -14));
    const daysToShow = 45;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);
    
    // State for modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState<{ cookDate: string; fermenterId: string } | undefined>(undefined);
    const [isChangeTankModalOpen, setIsChangeTankModalOpen] = useState(false);
    const [tankValidationInfo, setTankValidationInfo] = useState<{ requiredVolume: number; pendingCreation: { type: 'new'; data: { recipeId: string; cookDate: string; fermenterId: string; } } } | null>(null);

    // Effect to scroll to today's date on initial render
    useEffect(() => {
        if (todayRef.current && scrollContainerRef.current) {
            todayRef.current.scrollIntoView({
                behavior: 'auto',
                block: 'center',
            });
        }
    }, []);

    const sortedTanks = useMemo(() => {
        const tankOrder = ['Turn', 'FV', 'BT', 'Packaging'];
        return locations
            .filter(l => l.type === 'Tank')
            .sort((a, b) => {
                const typeA = tankOrder.findIndex(p => a.name.includes(p));
                const typeB = tankOrder.findIndex(p => b.name.includes(p));
                if (typeA !== typeB) return typeA - typeB;
                return a.name.localeCompare(b.name, undefined, { numeric: true });
            });
    }, [locations]);
    
    const dateRange = useMemo(() => {
        return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
    }, [startDate]);

    const { displayItems, dateToGridRowMap } = useMemo(() => {
        const items: ({ type: 'month'; monthName: string } | { type: 'day'; date: Date, isToday: boolean })[] = [];
        const dateMap = new Map<string, number>();
        let lastMonth: number | null = null;
        
        dateRange.forEach(date => {
            const currentMonth = date.getMonth();
            if (lastMonth !== currentMonth) {
                items.push({ type: 'month', monthName: date.toLocaleDateString(language, { month: 'long', year: 'numeric' }) });
                lastMonth = currentMonth;
            }
            items.push({ type: 'day', date, isToday: isSameDay(date, new Date()) });
        });

        let gridRow = 2;
        items.forEach(item => {
            if (item.type === 'day') {
                dateMap.set(getISODateString(item.date), gridRow);
            }
            gridRow++;
        });

        return { displayItems: items, dateToGridRowMap: dateMap };
    }, [dateRange, language]);

    const recipeColors = useMemo(() => {
        const colors = [
            'bg-sky-800/70 border-sky-500', 
            'bg-emerald-800/70 border-emerald-500', 
            'bg-rose-800/70 border-rose-500',
            'bg-amber-800/70 border-amber-500', 
            'bg-indigo-800/70 border-indigo-500', 
            'bg-teal-800/70 border-teal-500',
            'bg-pink-800/70 border-pink-500',
            'bg-purple-800/70 border-purple-500',
        ];
        const map = new Map<string, string>();
        recipes.forEach((recipe, index) => {
            map.set(recipe.id, colors[index % colors.length]);
        });
        return map;
    }, [recipes]);
    
    const hopsCategoryId = useMemo(() => categories.find(c => c.name === 'Hops')?.id, [categories]);

    // Helper to find which tank a batch is in on a specific date, considering transfers
    const getTankForDate = (batch: BrewSheet, date: Date, transferLogs: LogEntry[]): string => {
        let tankId = (transferLogs.length > 0 ? transferLogs[0].details?.fromTankId : batch.fermenterId) || batch.fermenterId;

        for (const log of transferLogs) {
            const transferDate = new Date(log.timestamp);
            transferDate.setUTCHours(0, 0, 0, 0);
            
            if (date.getTime() >= transferDate.getTime()) {
                tankId = log.details?.toTankId || tankId;
            } else {
                break; // Transfers are sorted, so we can stop
            }
        }
        return tankId;
    };

    const handleGoToToday = () => {
        setStartDate(addDays(new Date(), -14));
        setTimeout(() => {
            if (todayRef.current) {
                todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleCellClick = (date: Date, tankId: string) => {
        setModalInitialData({ cookDate: getISODateString(date), fermenterId: tankId });
        setIsCreateModalOpen(true);
    };

    const handleTankValidationFail = (info: NonNullable<typeof tankValidationInfo>) => {
        setTankValidationInfo(info);
        setIsChangeTankModalOpen(true);
    };

    const handleConfirmTankChange = (newTankId: string) => {
        if (!tankValidationInfo) return;
        const { pendingCreation } = tankValidationInfo;
        if (pendingCreation.type === 'new') {
            const { recipeId, cookDate } = pendingCreation.data;
            onCreateBatch(recipeId, { cookDate, fermenterId: newTankId });
        }
        setIsChangeTankModalOpen(false);
        setTankValidationInfo(null);
    };

    const calendarBatches = useMemo(() => {
        // Only render mother batches and standalone batches
        return batches.filter(b => !b.linkedBatchId);
    }, [batches]);

    return (
        <div className="h-full flex flex-col bg-color-background text-color-text">
            <CreateBatchModal
                isOpen={isCreateModalOpen}
                recipes={recipes}
                locations={locations}
                batches={batches}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={onCreateBatch}
                onValidationFail={handleTankValidationFail}
                t={t}
                initialData={modalInitialData}
            />
            {tankValidationInfo && (
                <ChangeTankModal
                    isOpen={isChangeTankModalOpen}
                    onClose={() => setIsChangeTankModalOpen(false)}
                    onConfirm={handleConfirmTankChange}
                    requiredVolume={tankValidationInfo.requiredVolume}
                    currentTank={locations.find(l => l.id === tankValidationInfo.pendingCreation.data.fermenterId)}
                    locations={locations}
                />
            )}
            <div className="relative z-40 bg-color-background flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-color-text">{t('Calendar')}</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={handleGoToToday} className="text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-color-border">{t('Today')}</button>
                    <button onClick={() => setStartDate(addDays(startDate, -7))} className="p-1.5 rounded-md hover:bg-color-border"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => setStartDate(addDays(startDate, 7))} className="p-1.5 rounded-md hover:bg-color-border"><ArrowRightIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-auto rounded-lg">
                <div className="relative grid" style={{ gridTemplateColumns: `3rem repeat(${sortedTanks.length}, minmax(65px, 1fr))` }}>
                    {/* Corner */}
                    <div className="sticky top-0 left-0 z-40 bg-color-surface border-r border-b border-color-border"></div>
                    {/* Tank Headers */}
                    {sortedTanks.map(tank => (
                        <div key={tank.id} className="sticky top-0 z-30 bg-color-surface p-1 md:p-2 text-center text-xs md:text-sm font-semibold border-b border-color-border" style={{height: '41px'}}>
                            {tank.name}
                        </div>
                    ))}
                    
                    {displayItems.map((item, index) => {
                         if (item.type === 'month') {
                            return (
                                <div key={item.monthName} style={{ gridRow: index + 2, gridColumn: '1 / -1' }} className="sticky top-[41px] z-5 bg-color-background/90 backdrop-blur-sm text-color-accent font-bold p-1 text-center border-b-2 border-color-accent">
                                    {item.monthName}
                                </div>
                            );
                        }
                        const { date, isToday } = item;
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                            <React.Fragment key={getISODateString(date)}>
                                <div ref={isToday ? todayRef : null} style={{ gridRow: index + 2 }} className={`sticky left-0 z-20 flex flex-col items-center justify-center p-1 text-xs text-center border-r border-b ${isWeekend ? 'bg-color-surface/80' : 'bg-color-surface'} ${isToday ? 'bg-color-accent/10 border-r-2 border-r-color-accent' : 'border-color-border'}`}>
                                    <span className={`font-bold ${isToday ? 'text-color-accent' : ''}`}>{dayOfWeek(date, language)}</span>
                                    <span className={`${isToday ? 'font-bold text-color-accent' : ''}`}>{date.getDate()}</span>
                                </div>
                                <div style={{ gridRow: index + 2, gridColumn: `2 / -1`}} className={`border-b ${isToday ? 'border-b-2 border-color-accent bg-color-accent/5' : 'border-color-border/50'}`}></div>
                            </React.Fragment>
                        );
                    })}

                    {sortedTanks.map((_, index) => (
                        <div key={index} style={{ gridRow: `2 / span ${displayItems.length}`, gridColumn: index + 2 }} className="border-l border-color-border/50"></div>
                    ))}

                    {dateRange.map(date => {
                        const row = dateToGridRowMap.get(getISODateString(date));
                        if (row === undefined) return null;
                        return sortedTanks.map((tank, colIndex) => (
                            <div key={`${getISODateString(date)}-${tank.id}`} style={{ gridRow: row, gridColumn: colIndex + 2, }} className="z-0 group">
                                <button onClick={() => handleCellClick(date, tank.id)} className="w-full h-full flex items-center justify-center text-gray-300 hover:bg-color-accent/10 rounded" aria-label={`${t('Add batch to')} ${tank.name} on ${date.toLocaleDateString()}`}>
                                    <PlusCircleIcon className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-color-accent/50" />
                                </button>
                            </div>
                        ));
                    })}

                    {/* Batch Segments & Tasks */}
                    {calendarBatches.filter(b => b.status !== 'Completed').map(batch => {
                        const recipe = recipes.find(r => r.id === batch.recipeId);
                        if (!recipe) return null;

                        const childBatches = batches.filter(b => b.linkedBatchId === batch.id);
                        const allLotsInGroup = [batch.lot, ...childBatches.map(c => c.lot)].sort();

                        const displayLot = batch.lot.split('/')[0];
                        const tooltipTitle = `${batch.beerName} - ${t('Lot')}: ${displayLot} (${allLotsInGroup.join(', ')})`;


                        // --- 1. Generate Tank Occupancy Segments ---
                        const transferLogs = batch.fermentationLog.actual.logEntries
                            .filter(entry => entry.type === 'transfer' && entry.details?.fromTankId && entry.details?.toTankId)
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                        const segments: { tankId: string; startDate: string; endDate: string; isFirstSegment: boolean }[] = [];
                        const cookDate = new Date(`${batch.cookDate}T00:00:00`);
                        let currentStartDateStr = batch.cookDate;
                        let currentTankId = (transferLogs.length > 0 ? transferLogs[0].details!.fromTankId : batch.fermenterId) || batch.fermenterId;

                        transferLogs.forEach(log => {
                            const transferDate = new Date(`${log.timestamp.substring(0, 10)}T00:00:00`);
                            const endDate = addDays(transferDate, -1);

                            segments.push({
                                tankId: currentTankId,
                                startDate: currentStartDateStr,
                                endDate: getISODateString(endDate),
                                isFirstSegment: currentStartDateStr === batch.cookDate,
                            });
                            currentStartDateStr = getISODateString(transferDate);
                            currentTankId = log.details!.toTankId!;
                        });

                        let packagingDayOffset: number;
                        const recipeFermentationDays = recipe.fermentationSteps.reduce((sum, step) => sum + step.days, 0);
                        if (batch.packagingLog?.packagingDate) {
                            const packagingDate = new Date(`${batch.packagingLog.packagingDate}T00:00:00`);
                            const utcCookDate = Date.UTC(cookDate.getFullYear(), cookDate.getMonth(), cookDate.getDate());
                            const utcPackagingDate = Date.UTC(packagingDate.getFullYear(), packagingDate.getMonth(), packagingDate.getDate());
                            packagingDayOffset = (utcPackagingDate - utcCookDate) / (1000 * 60 * 60 * 24);
                        } else {
                            packagingDayOffset = recipeFermentationDays;
                        }

                        const packagingDate = addDays(cookDate, packagingDayOffset);
                        segments.push({
                            tankId: currentTankId,
                            startDate: currentStartDateStr,
                            endDate: getISODateString(packagingDate),
                            isFirstSegment: currentStartDateStr === batch.cookDate,
                        });

                        // --- 2. Generate Tasks ---
                        const tasks = [];
                        tasks.push({ day: 0, icon: <span title="Brew Day"><MashTunIcon className="w-4 h-4 md:w-5 md:h-5" /></span> });

                        recipe.tankIngredients.forEach(ing => {
                            const masterItem = masterItems.find(mi => mi.id === ing.masterItemId);
                            if (masterItem?.categoryId === hopsCategoryId) tasks.push({ day: ing.day, icon: <span title={`Dry Hop: ${masterItem.name}`}><HopsIcon className="w-4 h-4 md:w-5 md:h-5" /></span> });
                        });
                        
                        let cumulativeDays = 0;
                        recipe.fermentationSteps.forEach((step, index) => {
                            if (cumulativeDays > packagingDayOffset) return;
                            const isCrash = step.description.toLowerCase().includes('crash');
                            const prevStep = index > 0 ? recipe.fermentationSteps[index - 1] : null;

                            if (index === 0 || isCrash || (prevStep && step.temperature !== prevStep.temperature)) {
                                const icon = isCrash ? <SnowflakeIcon className="w-4 h-4 mr-0.5" /> : <ThermometerIcon className="w-4 h-4 mr-0.5" />;
                                // FIX: Changed `step.temperature()` to `step.temperature` to correctly access the number property.
                                tasks.push({ day: cumulativeDays, icon: <div className="flex items-center text-sm font-semibold">{icon}<span title={`${step.description} @ ${step.temperature}°C`}>{step.temperature}°</span></div> });
                            }
                            cumulativeDays += step.days;
                        });

                        tasks.push({ day: packagingDayOffset, icon: <span title={t('Ready for Packaging')}><BottleIcon className="w-4 h-4 md:w-5 md:h-5" /></span> });
                        
                        const tasksForDayZero = tasks.filter(task => task.day === 0);
                        const otherTasks = tasks.filter(task => task.day !== 0);
                        const colorClass = recipeColors.get(batch.recipeId) || 'bg-gray-700/70 border-gray-500';

                        return (
                           <React.Fragment key={batch.id}>
                                {/* Render Segments */}
                                {segments.map((segment, index) => {
                                    const colIndex = sortedTanks.findIndex(t => t.id === segment.tankId);
                                    if (colIndex === -1) return null;
                                    const startRow = dateToGridRowMap.get(segment.startDate);
                                    if (startRow === undefined) return null;
                                    const startDateObj = new Date(`${segment.startDate}T00:00:00`);
                                    const endDateObj = new Date(`${segment.endDate}T00:00:00`);
                                    const duration = Math.max(1, Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                    if (duration <= 0) return null;

                                    return (
                                        <div key={index} style={{ gridColumn: colIndex + 2, gridRow: `${startRow} / span ${duration}` }} className="relative z-10 p-0.5">
                                            <button onClick={() => onSelectBatch(batch)} title={tooltipTitle} className={`w-full h-full rounded-md border text-white text-xs md:text-sm overflow-hidden p-1 ${colorClass} transition-all hover:shadow-lg hover:ring-2 hover:ring-color-accent text-left flex flex-col`}>
                                                {segment.isFirstSegment && (
                                                    <>
                                                        <div className="flex items-center justify-start flex-wrap gap-x-2">
                                                            {tasksForDayZero.map((task, idx) => (
                                                                <div key={idx} className="[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.8))]">{task.icon}</div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-1">
                                                            <p className="font-bold truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{batch.beerName}</p>
                                                            <p className="opacity-90 truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{t('Lot')}: {displayLot}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                                {/* Render Task Icons */}
                                {otherTasks.map((task, idx) => {
                                    const taskDate = addDays(cookDate, task.day);
                                    const taskTankId = getTankForDate(batch, taskDate, transferLogs);
                                    const colIndex = sortedTanks.findIndex(t => t.id === taskTankId);
                                    const taskRow = dateToGridRowMap.get(getISODateString(taskDate));
                                    if (taskRow === undefined || colIndex === -1) return null;

                                    return (
                                        <div key={`${batch.id}_task_${idx}`} style={{ gridColumn: colIndex + 2, gridRow: taskRow }} className="z-20 p-1 flex items-center justify-center text-white pointer-events-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.8))]">
                                            {task.icon}
                                        </div>
                                    );
                                })}
                           </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BrewPlannerPage;