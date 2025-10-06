import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BrewSheet, Recipe, Location, MasterItem, Category } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { HopsIcon, MashTunIcon, SnowflakeIcon, ThermometerIcon, ArrowLeftIcon, ArrowRightIcon } from '../components/Icons';

// Helper functions for date manipulation
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
}

const BrewPlannerPage: React.FC<BrewPlannerPageProps> = ({ batches, recipes, locations, masterItems, categories, onSelectBatch }) => {
    const { t, language } = useTranslation();
    const [startDate, setStartDate] = useState(() => addDays(new Date(), -14));
    const daysToShow = 45;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);

    // Effect to scroll to today's date on initial render
    useEffect(() => {
        if (todayRef.current && scrollContainerRef.current) {
            // The direct scrollIntoView is often more reliable than manual calculations.
            todayRef.current.scrollIntoView({
                behavior: 'auto', // Immediate jump, not smooth scroll
                block: 'center',  // Vertically center the element
            });
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Memoize sorted tanks for performance
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
    
    // Memoize date range
    const dateRange = useMemo(() => {
        return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
    }, [startDate]);

    // Create a list of items to display (days and month headers) and a map for grid row lookup
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

        // Build the map from date string to its grid row index
        let gridRow = 2; // Grid rows start at 1, our content starts at row 2
        items.forEach(item => {
            if (item.type === 'day') {
                dateMap.set(getISODateString(item.date), gridRow);
            }
            gridRow++;
        });

        return { displayItems: items, dateToGridRowMap: dateMap };
    }, [dateRange, language]);

    // Memoize color mapping for recipes
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

    const handleGoToToday = () => {
        setStartDate(addDays(new Date(), -14));
        setTimeout(() => {
            if (todayRef.current) {
                todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    return (
        <div className="h-full flex flex-col bg-color-background text-color-text">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text">{t('Calendar')}</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={handleGoToToday} className="text-sm font-semibold py-2 px-3 rounded-md hover:bg-color-border">{t('Today')}</button>
                    <button onClick={() => setStartDate(addDays(startDate, -7))} className="p-2 rounded-md hover:bg-color-border"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => setStartDate(addDays(startDate, 7))} className="p-2 rounded-md hover:bg-color-border"><ArrowRightIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-auto rounded-lg">
                <div className="relative grid" style={{ gridTemplateColumns: `4rem repeat(${sortedTanks.length}, minmax(80px, 1fr))` }}>
                    {/* Corner */}
                    <div className="sticky top-0 left-0 z-40 bg-color-surface border-r border-b border-color-border"></div>
                    {/* Tank Headers */}
                    {sortedTanks.map(tank => (
                        <div key={tank.id} className="sticky top-0 z-30 bg-color-surface p-2 text-center text-sm font-semibold border-b border-l border-color-border" style={{height: '41px'}}>
                            {tank.name}
                        </div>
                    ))}
                    
                    {/* Grid Content: Month Headers and Day Rows */}
                    {displayItems.map((item, index) => {
                         if (item.type === 'month') {
                            return (
                                <div 
                                    key={item.monthName}
                                    style={{ gridRow: index + 2, gridColumn: '1 / -1' }}
                                    className="sticky top-[41px] z-5 bg-color-background/90 backdrop-blur-sm text-color-accent font-bold p-1 text-center border-b-2 border-color-accent"
                                >
                                    {item.monthName}
                                </div>
                            );
                        }

                        // It's a day
                        const { date, isToday } = item;
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        
                        return (
                            <React.Fragment key={getISODateString(date)}>
                                {/* Date Cell */}
                                <div 
                                    ref={isToday ? todayRef : null} 
                                    style={{ gridRow: index + 2 }} 
                                    className={`sticky left-0 z-20 flex flex-col items-center justify-center p-1 text-xs text-center border-r border-b ${isWeekend ? 'bg-color-surface/80' : 'bg-color-surface'} ${isToday ? 'bg-color-accent/10 border-r-2 border-r-color-accent' : 'border-color-border'}`}
                                >
                                    <span className={`font-bold ${isToday ? 'text-color-accent' : ''}`}>{dayOfWeek(date, language)}</span>
                                    <span className={`${isToday ? 'font-bold text-color-accent' : ''}`}>{date.getDate()}</span>
                                </div>
                                {/* Horizontal Line across the row */}
                                <div style={{ gridRow: index + 2, gridColumn: `2 / -1`}} className={`border-b ${isToday ? 'border-b-2 border-color-accent bg-color-accent/5' : 'border-color-border/50'}`}></div>
                            </React.Fragment>
                        );
                    })}

                    {/* Vertical Grid Lines */}
                    {sortedTanks.map((_, index) => (
                        <div key={index} style={{ gridRow: `2 / span ${displayItems.length}`, gridColumn: index + 2 }} className="border-l border-color-border/50"></div>
                    ))}

                    {/* Batch Blocks */}
                    {batches.map(batch => {
                        const recipe = recipes.find(r => r.id === batch.recipeId);
                        if (!recipe) return null;
                        
                        const colIndex = sortedTanks.findIndex(t => t.id === batch.fermenterId);
                        if (colIndex === -1) return null;

                        const cookDate = new Date(`${batch.cookDate}T00:00:00`);
                        const startRow = dateToGridRowMap.get(batch.cookDate);
                        if (startRow === undefined) return null;

                        const duration = recipe.fermentationSteps.reduce((sum, step) => sum + step.days, 0) || 1;
                        const colorClass = recipeColors.get(batch.recipeId) || 'bg-gray-700/70 border-gray-500';

                        // Calculate all tasks for the batch
                        const tasks = [];
                        tasks.push({ day: 0, icon: <span title="Brew Day"><MashTunIcon className="w-5 h-5" /></span> });

                        recipe.tankIngredients.forEach(ing => {
                            const masterItem = masterItems.find(mi => mi.id === ing.masterItemId);
                            if (masterItem?.categoryId === hopsCategoryId) {
                                tasks.push({ day: ing.day, icon: <span title={`Dry Hop: ${masterItem.name}`}><HopsIcon className="w-5 h-5" /></span> });
                            }
                        });
                        
                        let cumulativeDays = 0;
                        recipe.fermentationSteps.forEach((step, index) => {
                            const isCrash = step.description.toLowerCase().includes('crash');
                            const previousStep = index > 0 ? recipe.fermentationSteps[index - 1] : null;

                            if (index === 0 || isCrash || (previousStep && step.temperature !== previousStep.temperature)) {
                                if (isCrash) {
                                    tasks.push({ day: cumulativeDays, icon: <div className="flex items-center text-sm font-semibold"><SnowflakeIcon className="w-4 h-4 mr-0.5" /><span title={`${step.description} @ ${step.temperature}°C`}>{step.temperature}°</span></div> });
                                } else {
                                    tasks.push({ day: cumulativeDays, icon: <div className="flex items-center text-sm font-semibold"><ThermometerIcon className="w-4 h-4 mr-0.5" /><span title={`${step.description} @ ${step.temperature}°C`}>{step.temperature}°</span></div> });
                                }
                            }
                            cumulativeDays += step.days;
                        });

                        const tasksForDayZero = tasks.filter(task => task.day === 0);
                        const otherTasks = tasks.filter(task => task.day !== 0);

                        return (
                           <React.Fragment key={batch.id}>
                                {/* The main clickable batch block container */}
                                <div
                                    style={{
                                        gridColumn: colIndex + 2,
                                        gridRow: `${startRow} / span ${duration}`,
                                    }}
                                    className="relative z-10 p-0.5"
                                >
                                    <button
                                        onClick={() => onSelectBatch(batch)}
                                        title={`${batch.beerName} - ${t('Lot')}: ${batch.lot}`}
                                        className={`w-full h-full rounded-md border text-white text-sm overflow-hidden p-1 ${colorClass} transition-all hover:shadow-lg hover:ring-2 hover:ring-color-accent text-left flex flex-col`}
                                    >
                                        {tasksForDayZero.length > 0 && (
                                            <div className="flex items-center justify-start flex-wrap gap-x-2">
                                                {tasksForDayZero.map((task, idx) => (
                                                    <div key={idx} className="[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.8))]">
                                                        {task.icon}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className={`${tasksForDayZero.length > 0 ? 'mt-1' : ''}`}>
                                            <p className="font-bold truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{batch.beerName}</p>
                                            <p className="opacity-90 truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{t('Lot')}: {batch.lot}</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Render icons for other days in their respective grid cells */}
                                {otherTasks.map((task, idx) => {
                                    const taskDateStr = getISODateString(addDays(cookDate, task.day));
                                    const taskRow = dateToGridRowMap.get(taskDateStr);
                                    if (taskRow === undefined) return null;

                                    return (
                                        <div 
                                            key={`${batch.id}_task_${idx}`}
                                            style={{ gridColumn: colIndex + 2, gridRow: taskRow }}
                                            className="z-20 p-1 flex items-center justify-center text-white pointer-events-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.8))]"
                                        >
                                            {task.icon}
                                        </div>
                                    )
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