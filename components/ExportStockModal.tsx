import React, { useState, useMemo } from 'react';
import Modal from './ui/Modal';
import MultiSelect from './ui/MultiSelect';
import Input from './ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import { Location, Category } from '../types';
import { DownloadIcon, FileSpreadsheetIcon } from './Icons';

export type ExportFilters = {
    locationIds: string[];
    categoryIds: string[];
    itemName: string;
};

interface ExportStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters, format: 'pdf' | 'excel') => void;
  locations: Location[];
  categories: Category[];
}

const ExportStockModal: React.FC<ExportStockModalProps> = ({ isOpen, onClose, onExport, locations, categories }) => {
  const { t } = useTranslation();
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');

  const locationOptions = useMemo(() => locations.map(l => ({ value: l.id, label: l.name })), [locations]);
  
  const categoryOptions = useMemo(() => {
    const parents = categories.filter(c => !c.parentCategoryId).sort((a,b) => t(a.name).localeCompare(t(b.name)));
    return parents.flatMap(parent => {
        const children = categories
            .filter(child => child.parentCategoryId === parent.id)
            .sort((a,b) => t(a.name).localeCompare(t(b.name)));
        
        return [
            { value: parent.id, label: t(parent.name) },
            ...children.map(child => ({ value: child.id, label: `  - ${t(child.name)}` }))
        ];
    });
  }, [categories, t]);

  const handleExport = (format: 'pdf' | 'excel') => {
    onExport({
      locationIds: selectedLocationIds,
      categoryIds: selectedCategoryIds,
      itemName
    }, format);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Export Stock')}>
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">{t('Select filters to refine your stock report.')}</p>
        <MultiSelect 
          label={t('Filter by Locations')}
          options={locationOptions}
          selectedValues={selectedLocationIds}
          onChange={setSelectedLocationIds}
        />
        <MultiSelect 
          label={t('Filter by Categories')}
          options={categoryOptions}
          selectedValues={selectedCategoryIds}
          onChange={setSelectedCategoryIds}
        />
        <Input 
          label={t('Filter by Item Name')}
          placeholder={t('e.g., Citra, Pilsner...')}
          value={itemName}
          onChange={e => setItemName(e.target.value)}
        />
      </div>
      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={() => handleExport('pdf')}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          <DownloadIcon className="w-5 h-5"/>
          <span>{t('Export as PDF')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport('excel')}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          <FileSpreadsheetIcon className="w-5 h-5"/>
          <span>{t('Export as Excel')}</span>
        </button>
      </div>
    </Modal>
  );
};

export default ExportStockModal;
