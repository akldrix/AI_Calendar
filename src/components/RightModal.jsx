import React from "react";
import {useState} from "react";
import "../styles/main.css";
import {Checkbox} from "antd";
import {Dropdown, Space} from "antd";
import {MoreOutlined} from "@ant-design/icons";
import {useLongPress} from "use-long-press";
import {Confirm} from "./Confirm";
import {ConfirmForm} from "../features/Tasks/ConfirmForm";

const RightModal = ({
                        selectedDate,
                        tasks,
                        onToggleTask,
                        onDelete,
                        taskChange,
                    }) => {
    const [taskToDelete, setTaskToDelete] = useState(null);
    const bind = useLongPress(
        (event, {context}) => {
            setTaskToDelete(context);
        },
        {
            threshold: 400,
            captureEvent: true,
            cancelOnMovement: true,
        },
    );

    if (!selectedDate)
        return <div className="right-modal-empty">Выберите день</div>;

    const todayTasks = tasks.filter((task) => task.date === selectedDate);

    const getNextDayString = (dateStr) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const nextDayString = getNextDayString(selectedDate);
    const tomorrowTasks = tasks.filter((task) => task.date === nextDayString);
    const sortTasks = (list) => {
        return [...list].sort((a, b) => {
            if (!a.start_time && b.start_time) return 1;
            if (a.start_time && !b.start_time) return -1;
            if (!a.start_time && !b.start_time) return 0;

            return a.start_time.localeCompare(b.start_time);
        });
    };

    return (
        <div className="right-modal-content">
            <div className="task-group">
                <h3 className="sidebar-title">
                    Дата: <span>{selectedDate}</span>
                </h3>
                {todayTasks.length > 0 ? (
                    <ul className="task-list">
                        {sortTasks(todayTasks).map((task) => {
                            const items = [
                                {
                                    key: "toggle",
                                    label: (
                                        <div
                                            className={
                                                task.completed
                                                    ? "complete-btn active"
                                                    : "complete-btn inactive"
                                            }
                                        >
                                            {task.completed ? "Выполнено" : "Выполнить"}
                                        </div>
                                    ),
                                    onClick: () => onToggleTask(task),
                                },
                                {
                                    key: "edit",
                                    label: <div className="menu-item-centered">Изменить</div>,
                                    onClick: () => taskChange(task),
                                },
                                {
                                    type: "divider",
                                },
                                {
                                    key: "delete",
                                    label: "Удалить",
                                    danger: true,
                                    onClick: () => setTaskToDelete(task),
                                },
                            ];
                            return (
                                <li
                                    onDoubleClick={() => onToggleTask(task)}
                                    {...bind(task)}
                                    style={{cursor: "pointer", userSelect: "none"}}
                                    key={task.id}
                                    className={`task-item category-${task.category} ${task.completed ? "completed" : ""}`}
                                >
                  <span className="task-text">
                    {!task.start_time ? (
                        <div className="task-row">
                            <div className="time-block">
                                <hr style={{width: "32px"}}/>
                            </div>
                            <div
                                className={`task-span category-${task.category}`}
                            ></div>
                            <div>{task.title}</div>
                        </div>
                    ) : (
                        <div className="task-row">
                            <div className="time-block">
                                <span className="time-start">{task.start_time}</span>
                                {task.end_time && (
                                    <>
                                        <span className="time-end">{task.end_time}</span>
                                    </>
                                )}
                            </div>
                            <div
                                className={`task-span category-${task.category}`}
                            ></div>
                            <div className="task-title">{task.title}</div>
                        </div>
                    )}
                  </span>

                                    <Dropdown
                                        overlayClassName="custom-dropdown"
                                        menu={{items: items}}
                                        trigger={["click"]}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="ant-dropdown-link action-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <MoreOutlined/>
                                        </button>
                                    </Dropdown>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="no-tasks">Нет задач</p>
                )}
            </div>

            <div className="divider"></div>

            <div className="task-group">
                <h3 className="sidebar-title">
                    Следующий день: <span>{nextDayString}</span>
                </h3>
                {tomorrowTasks.length > 0 ? (
                    <ul className="task-list">
                        {sortTasks(tomorrowTasks).map((task) => (
                            <li
                                key={task.id}
                                className={
                                    !task.completed
                                        ? `task-item faded category-${task.category}`
                                        : `task-item crossed faded category-${task.category}`
                                }
                            >
                <span className="task-text">
                  <div className="task-row">
                    <div
                        className={`task-span category-${task.category}`}
                    ></div>
                    <div>{task.title}</div>
                  </div>
                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-tasks">Нет планов на завтра</p>
                )}
            </div>
            <Confirm
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                title="Подтверждение"
            >
                <ConfirmForm
                    taskTitle={taskToDelete?.title}
                    onCancel={() => setTaskToDelete(null)}
                    onConfirm={() => {
                        onDelete(taskToDelete);
                        setTaskToDelete(null);
                    }}
                />
            </Confirm>
        </div>
    );
};

export default RightModal;
