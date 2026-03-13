import React from "react";


export const ConfirmForm = ({ onConfirm, onCancel, taskTitle }) => {
  return (
    <div className="confirm-form">
      <p>Вы уверены, что хотите удалить задачу "<strong>{taskTitle}</strong>"?</p>
      <div className="actions">
        <button type="button" onClick={onCancel}>Отмена</button>
        <button type="button" className="danger-btn" onClick={onConfirm}>
          Удалить
        </button>
      </div>
    </div>
  );
};


