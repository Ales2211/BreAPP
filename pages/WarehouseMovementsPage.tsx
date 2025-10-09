import React, { useMemo, useState } from 'react';
import { WarehouseMovement, MasterItem, Location, Category } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useTranslation } from '../hooks/useTranslation';
import EmptyState from '../components/ui/EmptyState';
import { HistoryIcon } from '../components/Icons';

interface WarehouseMovementsPageProps {
  movements: WarehouseMovement[];
  masterItems: MasterItem[];
  locations: Location[];
  categories: Category[];
}

const WarehouseMovementsPage: React.FC<WarehouseMovementsPageProps> = ({ movements, masterItems, locations, categories }) => {
    const { t } = useTranslation();
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedType, setSelectedType] = useState<'all' | WarehouseMovement['type']>('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? t(category.name) : 'N/A';
    };

    const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'N/A';
    
    const movementTypes: ('all' | WarehouseMovement['type'])[] = ['all', 'load', 'unload', 'brew_unload', 'move'];

    const filteredMovements = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        
        return movements
            .map(mov => {
                const masterItem = masterItems.find(mi => mi.id === mov.masterItemId);
                if (!masterItem) return null;
                return {
                    ...mov,
                    masterItem,
                    categoryName: getCategoryName(masterItem.categoryId),
                    locationName: getLocationName(mov.locationId),
                };
            })
            .filter((mov): mov is NonNullable<typeof mov> => {
                if (!mov) return false;
                
                // Date Range Filter
                if (dateRange.start && new Date(mov.timestamp) < new Date(dateRange.start)) return false;
                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999); // Include the whole end day
                    if (new Date(mov.timestamp) > endDate) return false;
                }
                
                // Type Filter
                if (selectedType !== 'all' && mov.type !== selectedType) return false;

                // Location Filter
                if (selectedLocation !== 'all' && mov.locationId !== selectedLocation) return false;

                // Category Filter
                if (selectedCategory !== 'all' && mov.masterItem.categoryId !== selectedCategory) return false;
                
                // Search Term Filter
                if (lowercasedTerm &&
                    !mov.masterItem.name.toLowerCase().includes(lowercasedTerm) &&
                    !mov.lotNumber.toLowerCase().includes(lowercasedTerm) &&
                    !(mov.documentNumber && mov.documentNumber.toLowerCase().includes(lowercasedTerm))
                ) {
                    return false;
                }
                
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, [movements, masterItems, locations, categories, t, searchTerm, dateRange, selectedType, selectedLocation, selectedCategory]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setDateRange({ start: '', end: '' });
        setSelectedType('all');
        setSelectedLocation('all');
        setSelectedCategory('all');
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Warehouse Movements')}</h1>
            
            <Card className="mb-6 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <Input 
                        label={t('Search by item, lot, or document...')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label={t('Start Date')} type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} />
                        <Input label={t('End Date')} type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} />
                    </div>
                     <Select label={t('Movement Type')} value={selectedType} onChange={e => setSelectedType(e.target.value as any)}>
                        {movementTypes.map(type => <option key={type} value={type}>{t(type.charAt(0).toUpperCase() + type.slice(1))}</option>)}
                    </Select>
                    <Select label={t('Location')} value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                        <option value="all">{t('All')}</option>
                        {locations.filter(l => l.type !== 'Tank').map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </Select>
                     <Select label={t('Category')} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                        <option value="all">{t('All')}</option>
                        {categories.filter(c => !c.parentCategoryId).map(cat => <option key={cat.id} value={cat.id}>{t(cat.name)}</option>)}
                    </Select>
                    <div className="self-end">
                        <button onClick={clearFilters} className="w-full bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-4 rounded-lg">{t('Clear Filters')}</button>
                    </div>
                </div>
            </Card>

            <div className="flex-1 overflow-y-auto pr-2">
                {filteredMovements.length > 0 ? (
                    <div className="bg-color-surface rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-color-background">
                                    <tr>
                                        <th className="py-2 px-3 font-semibold">{t('Timestamp')}</th>
                                        <th className="py-2 px-3 font-semibold">{t('Item Name')}</th>
                                        <th className="py-2 px-3 font-semibold">{t('Lot Number')}</th>
                                        <th className="py-2 px-3 font-semibold text-right">{t('Quantity')}</th>
                                        <th className="py-2 px-3 font-semibold">{t('Type')}</th>
                                        <th className="py-2 px-3 font-semibold">{t('Location')}</th>
                                        <th className="py-2 px-3 font-semibold">{t('Document Number')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-color-border/50">
                                    {filteredMovements.map(mov => (
                                        <tr key={mov.id}>
                                            <td className="py-2 px-3 whitespace-nowrap">{new Date(mov.timestamp).toLocaleString()}</td>
                                            <td className="py-2 px-3 font-semibold text-color-accent">{mov.masterItem.name}</td>
                                            <td className="py-2 px-3 font-mono">{mov.lotNumber}</td>
                                            <td className={`py-2 px-3 text-right font-mono font-bold ${mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {mov.quantity > 0 ? '+' : ''}{mov.quantity.toFixed(2)} {mov.masterItem.unit}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    mov.type === 'load' ? 'bg-green-100 text-green-800' :
                                                    mov.type === 'unload' ? 'bg-red-100 text-red-800' :
                                                    mov.type === 'move' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {t(mov.type.charAt(0).toUpperCase() + mov.type.slice(1))}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">{mov.locationName}</td>
                                            <td className="py-2 px-3 font-mono">{mov.documentNumber}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                     <div className="flex-1 flex items-center justify-center pt-10">
                        <EmptyState 
                            icon={<HistoryIcon className="w-12 h-12" />}
                            title={movements.length === 0 ? t('No movements found.') : t('No movements match your search.')}
                            message={movements.length === 0 ? '' : t('Try adjusting your filters.')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarehouseMovementsPage;