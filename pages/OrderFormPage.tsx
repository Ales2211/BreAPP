import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderItem, Customer, MasterItem, Category } from '../types';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon } from '../components/Icons';
import { useTranslation } from '../hooks/useTranslation';

interface OrderFormPageProps {
  order: Order | null;
  customers: Customer[];
  masterItems: MasterItem[];
  categories: Category[];
  onSave: (order: Order) => void;
  onBack: () => void;
}

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getBlankOrder = (customers: Customer[]): Omit<Order, 'id'> => ({
    customerId: customers.length > 0 ? customers[0].id : '',
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    requiredDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    items: [],
    notes: ''
});

const OrderFormPage: React.FC<OrderFormPageProps> = ({ order, customers, masterItems, categories, onSave, onBack }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Order | Omit<Order, 'id'>>(() => order || getBlankOrder(customers));

    useEffect(() => {
        setFormData(order || getBlankOrder(customers));
    }, [order, customers]);

    const finishedGoods = useMemo(() => {
        const finishedGoodsParentCat = categories.find(c => c.name === 'Finished Goods');
        if (!finishedGoodsParentCat) return [];
        const finishedGoodsCategoryIds = categories.filter(c => c.parentCategoryId === finishedGoodsParentCat.id).map(c => c.id);
        return masterItems.filter(mi => finishedGoodsCategoryIds.includes(mi.categoryId));
    }, [masterItems, categories]);
    
    const orderTotal = useMemo(() => {
        return formData.items.reduce((total, item) => {
            return total + (item.quantity * item.pricePerUnit);
        }, 0);
    }, [formData.items]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            const oldItem = newItems[index];
            const newItem = { ...oldItem, [field]: value };

            // If master item changed, update the price
            if (field === 'masterItemId') {
                const masterItem = masterItems.find(mi => mi.id === value);
                newItem.pricePerUnit = masterItem?.salePrice || 0;
            }

            newItems[index] = newItem;
            return { ...prev, items: newItems };
        });
    };

    const handleAddItem = () => {
        if (finishedGoods.length === 0) return;
        const selectedFg = finishedGoods[0];
        const newItem: OrderItem = {
            id: generateId(),
            masterItemId: selectedFg.id,
            quantity: 1,
            pricePerUnit: selectedFg.salePrice || 0,
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const handleRemoveItem = (id: string) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId || !formData.orderNumber) {
            // Add toast notification for error
            return;
        }
        onSave(formData as Order);
    };
    
    return (
        <form onSubmit={handleSave} className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button type="button" onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-color-border/50 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6"/>
                </button>
                <h1 className="text-3xl font-bold text-color-text">
                    {order ? t('Edit Order') : t('Create Order')}
                </h1>
            </div>
            
            <div className="space-y-6">
                <Card title={t('Order Details')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select 
                            label={t('Customer')} 
                            name="customerId" 
                            value={formData.customerId} 
                            onChange={handleChange} 
                            required
                        >
                            <option value="">{t('Select a customer...')}</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Input 
                            label={t('Order Number')} 
                            name="orderNumber" 
                            value={formData.orderNumber} 
                            onChange={handleChange} 
                            required 
                        />
                        <Input 
                            label={t('Order Date')} 
                            name="orderDate" 
                            type="date"
                            value={formData.orderDate} 
                            onChange={handleChange} 
                            required 
                        />
                        <Input 
                            label={t('Required Date')} 
                            name="requiredDate" 
                            type="date"
                            value={formData.requiredDate} 
                            onChange={handleChange} 
                            required 
                        />
                        <Select
                            label={t('Status')}
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            containerClassName="md:col-span-2"
                        >
                            <option value="Draft">{t('Draft')}</option>
                            <option value="Confirmed">{t('Confirmed')}</option>
                            <option value="Shipped">{t('Shipped')}</option>
                            <option value="Completed">{t('Completed')}</option>
                            <option value="Canceled">{t('Canceled')}</option>
                        </Select>
                    </div>
                </Card>

                <Card title={t('Order Items')}>
                    <div className="space-y-3">
                        {formData.items.map((item, index) => {
                            const masterItem = masterItems.find(mi => mi.id === item.masterItemId);
                            const lineTotal = item.quantity * item.pricePerUnit;
                            return (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-color-background p-2 rounded-md">
                                    <div className="col-span-12 sm:col-span-5">
                                        <Select
                                            label={t('Item')}
                                            value={item.masterItemId}
                                            onChange={e => handleItemChange(index, 'masterItemId', e.target.value)}
                                        >
                                            {finishedGoods.map(fg => <option key={fg.id} value={fg.id}>{fg.name}</option>)}
                                        </Select>
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <Input
                                            label={t('Quantity')}
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                                        />
                                    </div>
                                     <div className="col-span-4 sm:col-span-2">
                                        <Input
                                            label={t('Price per Unit')}
                                            type="number"
                                            step="0.01"
                                            value={item.pricePerUnit}
                                            onChange={e => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                            unit="€"
                                        />
                                    </div>
                                    <div className="col-span-3 sm:col-span-2 flex flex-col items-end">
                                        <label className="mb-1 text-sm font-medium text-gray-500">{t('Line Total')}</label>
                                        <p className="font-semibold h-[42px] flex items-center">{lineTotal.toFixed(2)} €</p>
                                    </div>
                                    <div className="col-span-1 flex justify-end items-center h-[42px]">
                                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-red-500 hover:text-red-400">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-4 flex items-center justify-center w-full space-x-2 text-center py-2 bg-color-border/50 hover:bg-color-border rounded-md font-semibold text-color-accent transition-colors">
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>{t('Add Item')}</span>
                    </button>
                    <div className="mt-6 border-t border-color-border pt-4 flex justify-end">
                        <div className="text-right">
                            <p className="text-gray-500">{t('Grand Total')}</p>
                            <p className="text-3xl font-bold text-color-accent">{orderTotal.toFixed(2)} €</p>
                        </div>
                    </div>
                </Card>
                 <Card title={t('Notes')}>
                    <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={4}
                        className="w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:ring-2 focus:ring-color-accent transition-colors"
                    />
                </Card>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
                 <button type="button" onClick={onBack} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                    {t('Cancel')}
                </button>
                <button type="submit" className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    {t('Save')}
                </button>
            </div>
        </form>
    );
};

export default OrderFormPage;