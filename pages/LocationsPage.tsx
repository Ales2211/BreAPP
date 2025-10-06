import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, BuildingStoreIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

interface LocationsPageProps {
  locations: Location[];
  onSaveLocation: (location: Location | Omit<Location, 'id'>) => void;
  onDeleteLocation: (locationId: string) => void;
}

const LocationModal: React.FC<{
    isOpen: boolean;
    location: Location | Omit<Location, 'id'> | null;
    onClose: () => void;
    onSave: (location: Location | Omit<Location, 'id'>) => void;
    t: (key: string) => string;
}> = ({ isOpen, location, onClose, onSave, t }) => {
    // Fix: Default type is now the more specific 'LocationType_Warehouse'.
    const [formData, setFormData] = useState(location || { name: '', type: 'LocationType_Warehouse' as Location['type'] });

    useEffect(() => {
        if (isOpen) {
            const defaultData = { name: '', type: 'LocationType_Warehouse' as Location['type'] };
            setFormData(location || defaultData);
        }
    }, [isOpen, location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'name') {
            setFormData(prev => ({...prev, name: value}));
        } else if (name === 'type') {
            setFormData(prev => ({...prev, type: value as Location['type']}));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-color-surface p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{animation: 'fade-in-scale 0.3s forwards'}}
            >
                <h2 className="text-2xl font-bold text-color-accent mb-6">
                    {('id' in formData && formData.id) ? t('Edit Location') : t('Create Location')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label={t('Location Name')} name="name" value={formData.name} onChange={handleChange} required />
                    {/* Fix: Update select options to use specific keys for location types to avoid translation conflicts. */}
                    <Select label={t('Location Type')} name="type" value={formData.type} onChange={handleChange}>
                        <option value="LocationType_Warehouse">{t('LocationType_Warehouse')}</option>
                        <option value="Tank">{t('Tank')}</option>
                        <option value="LocationType_Other">{t('LocationType_Other')}</option>
                    </Select>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                        <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Save')}</button>
                    </div>
                </form>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

const LocationCard: React.FC<{ location: Location, onEdit: () => void, onDelete: () => void, t: (key: string) => string }> = ({ location, onEdit, onDelete, t }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            onClick={onEdit}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
            role="button"
            tabIndex={0}
            aria-label={`Edit location ${location.name}`}
            className="bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-color-accent">{location.name}</h3>
                    <p className="text-sm text-gray-500">{t(location.type)}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-red-500"
                        aria-label={`Delete location ${location.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const LocationsPage: React.FC<LocationsPageProps> = ({ locations, onSaveLocation, onDeleteLocation }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

    const handleNewLocation = () => {
        setSelectedLocation(null);
        setIsModalOpen(true);
    };

    const handleEditLocation = (location: Location) => {
        setSelectedLocation(location);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLocation(null);
    };

    const handleDeleteRequest = (location: Location) => {
        setLocationToDelete(location);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (locationToDelete) {
            onDeleteLocation(locationToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setLocationToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <LocationModal isOpen={isModalOpen} location={selectedLocation} onClose={handleCloseModal} onSave={onSaveLocation} t={t} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Location')}
                message={`${t('Are you sure you want to delete location')} ${locationToDelete?.name}? ${t('This action cannot be undone.')}`}
            />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Locations')}</h1>
                <button onClick={handleNewLocation} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Location')}</span>
                </button>
            </div>
            {locations.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                     {locations.map(loc => (
                        <LocationCard 
                            key={loc.id}
                            location={loc}
                            onEdit={() => handleEditLocation(loc)}
                            onDelete={() => handleDeleteRequest(loc)}
                            t={t}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<BuildingStoreIcon className="w-12 h-12"/>}
                        title={t('No locations defined')}
                        message={t('Add your first warehouse or tank location.')}
                        action={{
                            text: t('Create New Location'),
                            onClick: handleNewLocation
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default LocationsPage;