import React from 'react';
import { BrewSheet, Recipe } from '../types';
import Card from '../components/ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { ClipboardCheckIcon } from '../components/Icons';

interface QualityControlPageProps {
    batches: BrewSheet[];
    recipes: Recipe[];
}

const QualityControlPage: React.FC<QualityControlPageProps> = ({ batches, recipes }) => {
    const { t } = useTranslation();

    // Placeholder content for now
    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Quality Control')}</h1>
            <Card>
                <div className="text-center py-8">
                    <ClipboardCheckIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-color-text">{t('QC Dashboard Coming Soon')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('A summary of batch quality and consistency will be available here.')}</p>
                </div>
            </Card>
        </div>
    );
};

export default QualityControlPage;