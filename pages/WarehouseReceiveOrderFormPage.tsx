import React from 'react';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowLeftIcon } from '../components/Icons';

const WarehouseReceiveOrderFormPage: React.FC = () => {
    const { t } = useTranslation();
    return (
    <div className="h-full flex flex-col">
        <div className="flex items-center mb-6">
            <button type="button" onClick={() => {}} className="p-2 mr-4 rounded-full hover:bg-color-border transition-colors">
                <ArrowLeftIcon className="w-6 h-6"/>
            </button>
            <h1 className="text-3xl font-bold text-color-text">
                Receive Purchase Order
            </h1>
        </div>
        <Card className="flex-1" bodyClassName="h-full flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl text-color-accent font-semibold">{t('Feature Coming Soon!')}</h2>
                <p className="text-gray-500 mt-2">{t('This feature is under construction.')}</p>
            </div>
        </Card>
    </div>
    );
};

export default WarehouseReceiveOrderFormPage;