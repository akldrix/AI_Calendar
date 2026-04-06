import React from "react";
import "../styles/confirm.css";
import type {ReactNode, MouseEvent} from "react";
import {cn} from "../utils/utils.ts";
import type {ConfirmProps} from "../types.ts";

export const Confirm: React.FC<ConfirmProps> = ({isOpen, onClose, title, children, className}) =>
{
    if (!isOpen) return null;

    const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    }
    return (
        <div className="modal-overlay confirm-modal-root" onClick={onClose}>
            <div
                className={cn("modal-content confirm-modal-box", className)}
                onClick={handleContentClick}
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
