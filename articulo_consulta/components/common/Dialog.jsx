import React from 'react';
import PropTypes from 'prop-types';
import { ButtonPrimary, ButtonSecondary } from './Button';
import Card, { CardHeader, CardContent, CardActions } from './Card';

/**
 * Componente de diálogo estandarizado que puede usarse para confirmaciones, alertas o formularios
 */
const Dialog = ({
  open = false,
  onClose,
  title,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  maxWidth = 'md',
  confirmColor = 'primary',
  showActions = true,
  closeOnBackdropClick = true,
  className = '',
}) => {
  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <Card className={`w-full max-w-${maxWidth} mx-4 ${className}`}>
        {title && <CardHeader title={title} />}
        
        <CardContent>
          {children}
        </CardContent>
        
        {showActions && (
          <CardActions>
            {onClose && (
              <ButtonSecondary onClick={onClose}>
                {cancelText}
              </ButtonSecondary>
            )}
            {onConfirm && (
              <ButtonPrimary 
                onClick={onConfirm} 
                color={confirmColor}
              >
                {confirmText}
              </ButtonPrimary>
            )}
          </CardActions>
        )}
      </Card>
    </div>
  );
};

/**
 * Componente de diálogo de confirmación preconfigurado
 */
export const ConfirmDialog = ({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'primary',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      confirmColor={confirmColor}
    >
      <p className="text-gray-600">{message}</p>
    </Dialog>
  );
};

/**
 * Componente de diálogo de alerta preconfigurado
 */
export const AlertDialog = ({
  open = false,
  onClose,
  title = 'Información',
  message,
  buttonText = 'Aceptar',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      confirmText={buttonText}
      onConfirm={onClose}
      showActions={true}
    >
      <p className="text-gray-600">{message}</p>
    </Dialog>
  );
};

/**
 * Componente de diálogo con formulario
 */
export const FormDialog = ({
  open = false,
  onClose,
  title,
  children,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  onSubmit,
  maxWidth = 'md',
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      showActions={false}
    >
      <form onSubmit={handleSubmit}>
        {children}
        
        <div className="flex justify-end space-x-3 mt-4">
          <ButtonSecondary 
            type="button" 
            onClick={onClose}
          >
            {cancelText}
          </ButtonSecondary>
          <ButtonPrimary type="submit">
            {confirmText}
          </ButtonPrimary>
        </div>
      </form>
    </Dialog>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'full']),
  confirmColor: PropTypes.string,
  showActions: PropTypes.bool,
  closeOnBackdropClick: PropTypes.bool,
  className: PropTypes.string
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string
};

AlertDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  buttonText: PropTypes.string
};

FormDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'full'])
};

export default Dialog; 