import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Select from './ui/Select';
import { useTranslation } from '../hooks/useTranslation';
import { Location } from '../types';
import { AlertTriangleIcon } from './Icons';

interface ChangeTankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTankId: string) => void;
  requiredVolume: number;
  currentTank: Location | undefined;
  locations: Location[];
}

const ChangeTankModal: React.FC<ChangeTankModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  requiredVolume,
  currentTank,
  locations,
}) => {
  const { t } = useTranslation();
  const [newTankId, setNewTankId] = useState('');

  const suitableTanks = locations.filter(l => l.type === 'Tank' && (l.grossVolumeL || 0) >= requiredVolume);

  useEffect(() => {
    if (isOpen && suitableTanks.length > 0) {
      setNewTankId(suitableTanks[0].id);
    } else {
      setNewTankId('');
    }
  }, [isOpen, locations, requiredVolume]); // dependencies corrected

  const handleSubmit = () => {
    if (newTankId) {
      onConfirm(newTankId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Insufficient Tank Volume')}>
        <div className="flex items-start bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex-shrink-0">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
                <p className="text-sm text-yellow-700">
                    {t('The selected tank')} <span className="font-bold">{currentTank?.name}</span> ({currentTank?.grossVolumeL || 0} L) {t('is too small for the required volume of')} <span className="font-bold">{requiredVolume.toFixed(0)} L</span>.
                </p>
            </div>
        </div>

        <p className="text-gray-500 mb-4">{t('Please select a larger tank from the list below.')}</p>

        {suitableTanks.length > 0 ? (
            <Select label={t('Select New Tank')} value={newTankId} onChange={(e) => setNewTankId(e.target.value)}>
                {suitableTanks.map(tank => (
                    <option key={tank.id} value={tank.id}>
                        {tank.name} ({tank.grossVolumeL} L)
                    </option>
                ))}
            </Select>
        ) : (
            <p className="text-red-600 font-semibold">{t('No suitable tanks available for the required volume.')}</p>
        )}
      
        <div className="flex justify-end space-x-4 pt-6">
            <button type="button" onClick={onClose} className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg">{t('Cancel')}</button>
            <button type="button" onClick={handleSubmit} disabled={!newTankId} className="bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                {t('Confirm Change')}
            </button>
        </div>
    </Modal>
  );
};

export default ChangeTankModal;
