import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger' or 'primary'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                        <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : 'text-blue-600'
                            }`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-gray-700">{message}</p>
                    </div>
                </div>

                <div className="flex space-x-3 pt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
