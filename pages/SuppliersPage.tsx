import React, { useState, useEffect, useMemo } from 'react';
import { Supplier } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, TruckIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/ui/Input';

interface SuppliersPageProps {
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Supplier | Omit<Supplier, 'id'>) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

const SupplierModal: React.FC<{
    isOpen: boolean;
    supplier: Supplier | Omit<Supplier, 'id'> | null;
    onClose: () => void;
    onSave: (supplier: Supplier | Omit<Supplier, 'id'>) => void;
    t: (key: string) => string;
}> = ({ isOpen, supplier, onClose, onSave, t }) => {
    const [formData, setFormData] = useState(supplier || { name: '', contactPerson: '', email: '', phone: '', address: '', website: '', notes: '' });

    useEffect(() => {
        if (isOpen) {
            const defaultData = { name: '', contactPerson: '', email: '', phone: '', address: '', website: '', notes: '' };
            setFormData(supplier || defaultData);
        }
    }, [isOpen, supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                    {('id' in formData && formData.id) ? t('Edit Supplier') : t('Modal_Create_Supplier')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label={t('Supplier Name')} name="name" value={formData.name} onChange={handleChange} required />
                    <Input label={t('Contact Person')} name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} />
                    <Input label={t('Email')} name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                    <Input label={t('Phone')} name="phone" value={formData.phone || ''} onChange={handleChange} />
                    <Input label={t('Address')} name="address" value={formData.address || ''} onChange={handleChange} />
                    <Input label={t('Website')} name="website" type="url" value={formData.website || ''} onChange={handleChange} />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-500">{t('Notes')}</label>
                        <textarea
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:ring-2 focus:ring-color-accent transition-colors"
                        />
                    </div>
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

const SupplierCard: React.FC<{ supplier: Supplier, onEdit: () => void, onDelete: () => void, t: (key: string) => string }> = ({ supplier, onEdit, onDelete, t }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };
    
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            onClick={onEdit}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
            role="button"
            tabIndex={0}
            aria-label={`Edit supplier ${supplier.name}`}
            className="bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-color-accent truncate">{supplier.name}</h3>
                    {supplier.contactPerson && <p className="text-sm text-gray-500 truncate">{t('Contact Person')}: {supplier.contactPerson}</p>}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4 text-sm text-gray-500 mt-2">
                        {supplier.email && <span className="truncate">{t('Email')}: {supplier.email}</span>}
                        {supplier.phone && <span className="truncate">{t('Phone')}: {supplier.phone}</span>}
                    </div>
                     {supplier.website && (
                        <a 
                            href={supplier.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={handleLinkClick}
                            className="text-sm text-color-secondary hover:underline truncate block mt-1"
                        >
                            {supplier.website}
                        </a>
                    )}
                </div>
                 <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-red-500"
                        aria-label={`Delete supplier ${supplier.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers, onSaveSupplier, onDeleteSupplier }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const lowercasedTerm = searchTerm.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(lowercasedTerm)
        );
    }, [suppliers, searchTerm]);

    const handleNewSupplier = () => {
        setSelectedSupplier(null);
        setIsModalOpen(true);
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSupplier(null);
    };

    const handleDeleteRequest = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (supplierToDelete) {
            onDeleteSupplier(supplierToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setSupplierToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <SupplierModal isOpen={isModalOpen} supplier={selectedSupplier} onClose={handleCloseModal} onSave={onSaveSupplier} t={t} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Supplier')}
                message={`${t('Are you sure you want to delete supplier')} ${supplierToDelete?.name}? ${t('This action cannot be undone.')}`}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text">{t('Suppliers')}</h1>
                <div className="flex items-center gap-4 w-full md:w-auto md:flex-1 md:justify-end">
                    <div className="flex-grow max-w-sm">
                        <Input
                            placeholder={t('Search by name...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={handleNewSupplier} className="flex-shrink-0 flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <PlusCircleIcon className="w-6 h-6" />
                        <span>{t('New Supplier')}</span>
                    </button>
                </div>
            </div>
            {filteredSuppliers.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredSuppliers.map(sup => (
                        <SupplierCard 
                            key={sup.id} 
                            supplier={sup} 
                            onEdit={() => handleEditSupplier(sup)} 
                            onDelete={() => handleDeleteRequest(sup)}
                            t={t}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<TruckIcon className="w-12 h-12"/>}
                        title={suppliers.length === 0 ? t('No suppliers found') : t('No suppliers match your search.')}
                        message={suppliers.length === 0 ? t('Add your first supplier to get started.') : t('Try a different search term.')}
                        action={suppliers.length === 0 ? {
                            text: t('Create New Supplier'),
                            onClick: handleNewSupplier
                        } : undefined}
                    />
                </div>
            )}
        </div>
    );
};

export default SuppliersPage;