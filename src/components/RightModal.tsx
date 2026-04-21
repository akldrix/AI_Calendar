import React, {useEffect, useMemo} from "react";
import {useState} from "react";
import {lazy, Suspense} from "react";
import "../styles/main.css";
import {Checkbox} from "antd";
import {Dropdown, Space} from "antd";
import {MoreOutlined} from "@ant-design/icons";
import {useLongPress} from "use-long-press";
import {Confirm} from "./Confirm";
import type {Task} from "../types.ts";
import type {MenuProps} from "antd";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
const ConfirmForm = lazy(()  => import("../features/Tasks/ConfirmForm"));

interface RightModalProps {
    selectedDate: string | null;
    tasks: Task[];
    onToggleTask: (task: Task) => void;
    onDelete: (task: Task) => void;
    taskChange: (task: Task) => void;
    isLoading?: boolean;
    isPending?: boolean;
}

const RightModal: React.FC<RightModalProps> = ({
                                                   selectedDate,
                                                   tasks,
                                                   onToggleTask,
                                                   onDelete,
                                                   taskChange,
                                                   isLoading,
                                               }) => {
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const bind = useLongPress<HTMLLIElement, Task>(
        (event, {context}) => {
            if (context) setTaskToDelete(context);
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

    const getNextDayString = (dateStr: string): string => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const nextDayString = getNextDayString(selectedDate);
    const tomorrowTasks = tasks.filter((task) => task.date === nextDayString);
    const sortTasks = (list: Task[]): Task[] => {
        return [...list].sort((a, b) => {
            if (!a.start_time && b.start_time) return 1;
            if (a.start_time && !b.start_time) return -1;
            if (!a.start_time && !b.start_time) return 0;

            return (a.start_time || "").localeCompare(b.start_time || "");
        });
    };
    const sortedTodayTasks = useMemo(() => sortTasks(todayTasks), [todayTasks]);
    const sortedTomorrowTasks = useMemo(() => sortTasks(tomorrowTasks), [tomorrowTasks]);

    const TaskSkeleton = () => (
        <li className="task-item" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '40px', marginRight: '15px' }}>
                <Skeleton width={35} height={12} count={2} />
            </div>
            <div style={{ flex: 1 }}>
                <Skeleton height={20} width="80%" />
            </div>
        </li>
    );
    return (
        <div className="right-modal-content">
            <div className="task-group">
                <h3 className="sidebar-title">
                    Дата: <span>{selectedDate}</span>
                </h3>
                {isLoading ? (<ul className="task-list">
                        <TaskSkeleton />
                        <TaskSkeleton />
                        <TaskSkeleton />
                    </ul>) :
                    sortedTodayTasks.length > 0 ? (
                    <ul className="task-list">
                        {sortedTodayTasks.map((task) => {
                            const items: MenuProps['items'] = [
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
                                    type: "divider" as const,
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
                                    >
                                        <button type={"button"}
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
                {isLoading ? (<ul className="task-list">
                        <TaskSkeleton />
                        <TaskSkeleton />
                        <TaskSkeleton />
                    </ul>):
                    sortedTomorrowTasks.length > 0 ? (
                    <ul className="task-list">
                        {sortedTomorrowTasks.map((task) => (
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
                <Suspense fallback={<div>Загрузка формы...</div>}>
                <ConfirmForm
                    taskTitle={taskToDelete?.title || ""}
                    onCancel={() => setTaskToDelete(null)}
                    onConfirm={() => {
                        if (taskToDelete) onDelete(taskToDelete);
                        setTaskToDelete(null);
                    }}
                />
                </Suspense>
            </Confirm>
        </div>
    );
};

export default RightModal;
