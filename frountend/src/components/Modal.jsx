import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      setIsMaximized(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`modal-backdrop ${isMinimized ? 'modal-backdrop-minimized' : ''}`}>
      <div 
        className={`modal-container ${size === 'lg' ? 'modal-lg' : ''} ${isMinimized ? 'modal-minimized' : ''} ${isMaximized ? 'modal-maximized' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <div className="modal-window-controls">
            <button className="btn-icon" onClick={() => setIsMinimized(prev => !prev)} title={isMinimized ? 'Restore saved draft' : 'Save draft and minimize'} aria-label={isMinimized ? 'Restore saved draft' : 'Save draft and minimize'}>
              <Minus size={16} />
            </button>
            <button className="btn-icon" onClick={() => { setIsMaximized(prev => !prev); setIsMinimized(false); }} title={isMaximized ? 'Restore window' : 'Maximize window'}>
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button className="btn-icon" onClick={onClose} title="Close window">
              <X size={18} />
            </button>
          </div>
        </div>
        {!isMinimized && <div className="modal-body">{children}</div>}
      </div>
    </div>
  );
};
