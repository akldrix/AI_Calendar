import React from "react";
import "../styles/confirm.css";

export const Confirm = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay confirm-modal-root" onClick={onClose}>
      <div
        className="modal-content confirm-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="confirm-body">{children}</div>
      </div>
    </div>
  );
};
