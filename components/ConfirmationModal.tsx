import React from 'react';
import Modal from './ui/Modal';
import { useTranslation } from '../hooks/useTranslation';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const { t } = useTranslation();

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-gray-500 mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg"
                >
                    {t('Cancel')}
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                    {t('Delete')}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;