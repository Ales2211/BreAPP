import React, { useState } from 'react';
import { Order, Customer } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { PlusCircleIcon, TrashIcon, ShoppingBagIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';
import ConfirmationModal from '../components/ConfirmationModal';

interface OrdersListPageProps {
    orders: Order[];
    customers: Customer[];
    onNewOrder: () => void;
    onSelectOrder: (order: Order) => void;
    onDeleteOrder: (orderId: string) => void;
}

const statusColors: { [key in Order['status']]: string } = {
    'Draft': 'bg-gray-400',
    'Confirmed': 'bg-blue-500',
    'Shipped': 'bg-purple-500',
    'Completed': 'bg-green-500',
    'Canceled': 'bg-red-500',
};

const OrderCard: React.FC<{ order: Order, customerName: string, onSelect: () => void, onDelete: () => void, t: (key: string) => string }> = ({ order, customerName, onSelect, onDelete, t }) => {
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const orderTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);


    return (
        <div 
            onClick={onSelect} 
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
            role="button"
            tabIndex={0}
            aria-label={`View details for order ${order.orderNumber}`}
            className="group bg-color-surface rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="mb-2 sm:mb-0 flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-color-accent truncate">{t('Order')} #{order.orderNumber}</h3>
                    <p className="text-sm font-semibold text-color-text truncate">{customerName}</p>
                    <div className="text-sm text-gray-500 mt-2 truncate">
                        <span>{t('Order Date')}: {order.orderDate}</span> | <span>{t('Required Date')}: {order.requiredDate}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4 self-end sm:self-center">
                     <div className="text-right">
                        <div className="text-xl font-bold text-color-text">{orderTotal.toFixed(2)} €</div>
                        <div className="text-xs text-gray-500">{totalItems} items</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[order.status]}`}></div>
                        <span className="text-sm font-semibold">{t(order.status)}</span>
                    </div>
                    <button 
                        onClick={handleDeleteClick} 
                        className="p-2 rounded-full text-gray-500 hover:bg-color-background hover:text-red-500 focus:opacity-100 transition-colors z-10"
                        aria-label={`Delete order ${order.orderNumber}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrdersListPage: React.FC<OrdersListPageProps> = ({ orders, customers, onNewOrder, onSelectOrder, onDeleteOrder }) => {
    const { t } = useTranslation();
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    }
    
    const handleDeleteRequest = (order: Order) => {
        setOrderToDelete(order);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (orderToDelete) {
            onDeleteOrder(orderToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setOrderToDelete(null);
    };

    return (
        <div className="h-full flex flex-col">
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('Delete Order')}
                message={`${t('Are you sure you want to delete order')} #${orderToDelete?.orderNumber}? ${t('This action cannot be undone.')}`}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-color-text mb-4 md:mb-0">{t('Orders')}</h1>
                <button onClick={onNewOrder} className="flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    <PlusCircleIcon className="w-6 h-6" />
                    <span>{t('New Order')}</span>
                </button>
            </div>
            
            {orders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState 
                        icon={<ShoppingBagIcon className="w-12 h-12"/>}
                        title={t('No orders yet')}
                        message={t("Create your first order to see it listed here.")}
                        action={{
                            text: t('New Order'),
                            onClick: onNewOrder
                        }}
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {orders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            customerName={getCustomerName(order.customerId)}
                            onSelect={() => onSelectOrder(order)} 
                            onDelete={() => handleDeleteRequest(order)} 
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersListPage;