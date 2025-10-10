import React from 'react';
import Modal from './ui/Modal';
import { useTranslation } from '../hooks/useTranslation';

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceivePOModal: React.FC<ReceivePOModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={"Receive Purchase Order"}>
            <p className="text-gray-500 mb-6">This is a placeholder for receiving a purchase order.</p>
            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-color-border hover:bg-gray-300 text-color-text font-bold py-2 px-6 rounded-lg"
                >
                    {t('Cancel')}
                </button>
            </div>
        </Modal>
    );
};

export default ReceivePOModal;