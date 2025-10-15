

import React, { useState } from 'react';
import { TransportDocument, Order, Customer } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, TruckIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';

interface ShippingPageProps {
    transportDocuments: TransportDocument[];
    orders: Order[];
    customers: Customer[];
    onNewDocument: (fromOrderId?: string) => void;
    onSelectDocument: (doc: TransportDocument) => void;
    onDeleteDocument: (docId: string) => void;
}

const DocumentCard: React.FC<{ doc: TransportDocument, customerName: string, onSelect: () => void, onDelete: () => void, t: (key: string) => string }> = ({ doc, customerName, onSelect, onDelete, t }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const totalItems = doc.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div 
            onClick={onSelect} 
            className="group bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="mb-2 sm:mb-0 flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-color-accent truncate">{t('Document Number')} #{doc.documentNumber}</h3>
                    <p className="text-sm font-semibold text-color-text truncate">{customerName}</p>
                    <div className="text-sm text-gray-500 mt-2 truncate">
                        <span>{t('Shipping Date')}: {doc.shippingDate}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="text-right">
                        <div className="text-sm text-gray-500">{totalItems} items</div>
                    </div>
                    <button 
                        onClick={handleDeleteClick} 
                        className="p-2 rounded-full text-gray-500 hover:bg-color-background hover:text-red-500 z-10"
                        aria-label={`Delete document ${doc.documentNumber}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateDocumentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (fromOrderId?: string) => void;
    orders: Order[];
    t: (key: string) => string;
}> = ({ isOpen, onClose, onCreate, orders, t }) => {
    const [fromOrder, setFromOrder] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');

    const unfulfilledOrders = orders.filter(o => o.status === 'Confirmed');

    const handleCreate = () => {
        onCreate(fromOrder ? selectedOrderId : undefined);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('New Transport Document')}>
            <div className="space-y-4">
                <p className="text-gray-500">{t('How would you like to create the document?')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setFromOrder(true)} className={`p-4 border-2 rounded-lg text-left ${fromOrder ? 'border-color-accent bg-color-accent/10' : 'border-color-border hover:border-color-accent/50'}`}>
                        <h4 className="font-bold">{t('Create from Order')}</h4>
                        <p className="text-sm text-gray-500">{t('Select an order to pre-fill the document.')}</p>
                    </button>
                     <button onClick={() => setFromOrder(false)} className={`p-4 border-2 rounded-lg text-left ${!fromOrder ? 'border-color-accent bg-color-accent/10' : 'border-color-border hover:border-color-accent/50'}`}>
                        <h4 className="font-bold">{t('Create New')}</h4>
                        <p className="text-sm text-gray-500">{t('Create a blank document from scratch.')}</p>
                    </button>
                </div>
                {fromOrder && (
                    <Select label={t('Select Order')} value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                        <option value="">{t('Select an order...')}</option>
                        {unfulfilledOrders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerId}</option>)}
                    </Select>
                )}
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
                    <button type="button" onClick={handleCreate} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">{t('Create')}</button>
                </div>
            </div>
        </Modal>
    );
};

const ShippingPage: React.FC<ShippingPageProps> = ({ transportDocuments, orders, customers, onNewDocument, onSelectDocument, onDeleteDocument }) => {
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<TransportDocument | null>(null);

    const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'Unknown Customer';

    const handleDeleteRequest = (doc: TransportDocument) => {
        setDocToDelete(doc);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (docToDelete) {
            onDeleteDocument(docToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setDocToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <CreateDocumentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={onNewDocument} orders={orders} t={t} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Transport Document')}
                message={`${t('Are you sure you want to delete document')} #${docToDelete?.documentNumber}? ${t('This action cannot be undone.')}`}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text">{t('Shipping')}</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0 flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Transport Document')}</span>
                </button>
            </div>
            {transportDocuments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<TruckIcon className="w-12 h-12"/>}
                        title={t('No transport documents found')}
                        message={t('Create your first transport document.')}
                        action={{ text: t('New Transport Document'), onClick: () => setIsCreateModalOpen(true) }}
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {transportDocuments.map(doc => (
                        <DocumentCard 
                            key={doc.id} 
                            doc={doc} 
                            customerName={getCustomerName(doc.customerId)}
                            onSelect={() => onSelectDocument(doc)} 
                            onDelete={() => handleDeleteRequest(doc)} 
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShippingPage;