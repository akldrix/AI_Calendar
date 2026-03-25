import React from "react";
import { useEffect, useRef } from "react";

export const ConfirmForm = ({ onConfirm, onCancel, taskTitle }) => {
  const confirmBtnRef = useRef(null);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "Enter") onConfirm();
    };

    document.addEventListener("keydown", handleKeyDown);

    confirmBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, onConfirm]);

  return (
    <div className="confirm-form">
      <p>
        Вы уверены, что хотите удалить задачу "<strong>{taskTitle}</strong>"?
      </p>
      <div className="actions">
        <button type="button" onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          ref={confirmBtnRef}
          className="primary"
          onClick={onConfirm}
        >
          Удалить
        </button>
      </div>
    </div>
  );
};
