import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, UsersIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

interface CustomersPageProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer | Omit<Customer, 'id'>) => void;
  onDeleteCustomer: (customerId: string) => void;
}

const CustomerModal: React.FC<{
    isOpen: boolean;
    customer: Customer | Omit<Customer, 'id'> | null;
    onClose: () => void;
    onSave: (customer: Customer | Omit<Customer, 'id'>) => void;
    t: (key: string) => string;
}> = ({ isOpen, customer, onClose, onSave, t }) => {
    const [formData, setFormData] = useState(customer || { name: '', vatNumber: '', address: '', email: '', phone: '', notes: '' });

    useEffect(() => {
        if (isOpen) {
            const defaultData = { name: '', vatNumber: '', address: '', email: '', phone: '', notes: '' };
            setFormData(customer || defaultData);
        }
    }, [isOpen, customer]);

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={('id' in formData && formData.id) ? t('Edit Customer') : t('Create Customer')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={t('Customer Name')} name="name" value={formData.name} onChange={handleChange} required />
                <Input label={t('VAT Number')} name="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} />
                <Input label={t('Email')} name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                <Input label={t('Phone')} name="phone" value={formData.phone || ''} onChange={handleChange} />
                <Input label={t('Address')} name="address" value={formData.address || ''} onChange={handleChange} />
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
        </Modal>
    );
};

const CustomerCard: React.FC<{ customer: Customer, onEdit: () => void, onDelete: () => void, t: (key: string) => string }> = ({ customer, onEdit, onDelete, t }) => {
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
            aria-label={`Edit customer ${customer.name}`}
            className="bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-color-accent truncate">{customer.name}</h3>
                    {customer.vatNumber && <p className="text-sm text-gray-500 truncate">{t('VAT Number')}: {customer.vatNumber}</p>}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4 text-sm text-gray-500 mt-2">
                        {customer.email && <span className="truncate">{t('Email')}: {customer.email}</span>}
                        {customer.phone && <span className="truncate">{t('Phone')}: {customer.phone}</span>}
                    </div>
                </div>
                 <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-md hover:bg-color-border text-gray-500 hover:text-red-500"
                        aria-label={`Delete customer ${customer.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, onSaveCustomer, onDeleteCustomer }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    const handleNewCustomer = () => {
        setSelectedCustomer(null);
        setIsModalOpen(true);
    };

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCustomer(null);
    };

    const handleDeleteRequest = (customer: Customer) => {
        setCustomerToDelete(customer);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (customerToDelete) {
            onDeleteCustomer(customerToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setCustomerToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <CustomerModal isOpen={isModalOpen} customer={selectedCustomer} onClose={handleCloseModal} onSave={onSaveCustomer} t={t} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Customer')}
                message={`${t('Are you sure you want to delete customer')} ${customerToDelete?.name}? ${t('This action cannot be undone.')}`}
            />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Customers')}</h1>
                <button onClick={handleNewCustomer} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Customer')}</span>
                </button>
            </div>
            {customers.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {customers.map(sup => (
                        <CustomerCard 
                            key={sup.id} 
                            customer={sup} 
                            onEdit={() => handleEditCustomer(sup)} 
                            onDelete={() => handleDeleteRequest(sup)}
                            t={t}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<UsersIcon className="w-12 h-12"/>}
                        title={t('No customers found')}
                        message={t('Add your first customer to get started.')}
                        action={{
                            text: t('Create New Customer'),
                            onClick: handleNewCustomer
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CustomersPage;
