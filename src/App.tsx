import {useState, useEffect} from "react";
import CalendarGrid from "./features/Calendar/CalendarGrid.tsx";
import Modal from "./components/Modal.tsx";
import ManualTaskForm from "./features/Tasks/ManualTaskForm.tsx";
import RightModal from "./components/RightModal.tsx";
import {useCalendar} from "./hooks/useCalendar.tsx";
import {useTasks} from "./hooks/useTasks.tsx";
import {FilterCategory} from "./features/Tasks/FilterCategory.tsx";
import {MoonIcon} from "./components/Icons/Moon.tsx";
import {SunIcon} from "./components/Icons/Sun.tsx";
import {useHotkeys} from "react-hotkeys-hook";
import type {Task, TaskFormData} from "./types.ts";

function App() {
    const {
        currentDate,
        setCurrentDate,
        monthName,
        year,
        daysInMonth,
        startDay,
        endDay,
        nextMonth,
        prevMonth,
        prevDaysInMonth,
    } = useCalendar();

    const {
        tasks,
        isLoading,
        isPending,
        generateFromPrompt,
        addManualTask,
        handleToggle,
        handleDeleteTask,
        handleTaskChange,
    } = useTasks();

    const toDateString = (date: Date): string => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    };

    const [selectedDate, setSelectedDate] = useState(toDateString(currentDate));
    const [isModalOpen, setModalOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if(isPending) {
            timer = setTimeout(() => {
                setShowSkeleton(true);
            }, 50);
        } else {
            setShowSkeleton(false);
        }
        return () => {
            clearTimeout(timer);
        }
    }, [isPending]);


    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);
    const filteredTasks = tasks.filter(
        (task) => !hiddenCategories.includes(task.category),
    );
    const toggleTheme = () => {
        if (!document.startViewTransition) {
            setTheme((prev) => (prev === "light" ? "dark" : "light"));
            return;
        }
        document.startViewTransition(() => {
            setTheme((prev) => (prev === "light" ? "dark" : "light"));
        });
    };
    useHotkeys<HTMLBaseElement>("alt+space, ctrl+t", () => {
        toggleTheme();
    });
    type Direction = 'right' | 'left' | 'up' | 'down';
    const toNextString = (date: Date, direction: Direction) => {
        if (!date || isNaN(date.getTime())) return "";
        const nextDate = new Date(date);

        switch (direction) {
            case "right":
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case "left":
                nextDate.setDate(nextDate.getDate() - 1);
                break;
            case "up":
                nextDate.setDate(nextDate.getDate() - 7);
                break;
            case "down":
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            default:
                nextDate.setDate(nextDate.getDate() + 1);
        }

        const year = nextDate.getFullYear();
        const month = String(nextDate.getMonth() + 1).padStart(2, "0");
        const day = String(nextDate.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    useHotkeys<HTMLBaseElement>("left, right, up, down", (event) => {
        event.preventDefault();

        const direction = event.key.replace('Arrow', '').toLowerCase() as Direction;

        setSelectedDate((prevSelected: string) => {
            const currentSelectedObj = new Date(prevSelected.replace(/-/g, "/"));
            const nextDateStr = toNextString(currentSelectedObj, direction);

            setCurrentDate(new Date(nextDateStr.replace(/-/g, "/")));

            return nextDateStr;
        });
    }, {
        enableOnFormTags: true
    }, [selectedDate]);


    const handleJumpToDate = (dateString: string) => {
        const targetDate = new Date(dateString);

        setCurrentDate(targetDate);

        setSelectedDate(dateString);
    };

    const toggleCategory = (categoryId: string) => {
        setHiddenCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId],
        );
    };
    useHotkeys<HTMLBaseElement>("shift+h", () => {
        toggleCategory("home");
    });
    useHotkeys<HTMLBaseElement>("shift+w", () => {
        toggleCategory("work");
    });
    useHotkeys<HTMLBaseElement>("shift+s", () => {
        toggleCategory("self");
    });

    useHotkeys<HTMLBaseElement>("shift+right", () => {
        nextMonth();
    });
    useHotkeys<HTMLBaseElement>("shift+left", () => {
        prevMonth();
    });
    const handleAiSend = (): void => {
        if (!prompt.trim()) return;
       void generateFromPrompt(prompt);
        setPrompt("");
    };
    useHotkeys<HTMLBaseElement>("ctrl+a", () => {
        setModalOpen(true);
    });
    const handleEditClick = (task: Task) => {
        setEditingTask(task);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditingTask(null);
    };
    return (
        <div className="app-container">
            <header className="header">
                <div>
                    <h1>AI Календарь</h1>
                    <p className="subtitle">
                        {monthName} {year}
                    </p>
                </div>
                <div>
                    <FilterCategory
                        hiddenCategories={hiddenCategories}
                        onToggle={toggleCategory}
                    />
                </div>
                <div className="header-controls">
                    <button onClick={toggleTheme} className="theme-toggle">
                        {theme === "light" ? <MoonIcon/> : <SunIcon/>}
                    </button>
                    <button onClick={prevMonth}>&lt;</button>
                    <button onClick={nextMonth}>&gt;</button>
                    <button
                        className="add-btn"
                        onClick={() => {
                            setEditingTask(null);
                            setModalOpen(true);
                        }}
                    >
                        + Задача
                    </button>
                </div>
            </header>
            <div>
                <CalendarGrid
                    tasks={filteredTasks}
                    daysInMonth={daysInMonth}
                    startDayOffset={startDay}
                    currentDate={currentDate}
                    onSelect={setSelectedDate}
                    selectedDate={selectedDate}
                    prevDaysInMonth={prevDaysInMonth}
                />
                <RightModal
                    selectedDate={selectedDate}
                    tasks={filteredTasks}
                    onToggleTask={handleToggle}
                    onDelete={handleDeleteTask}
                    taskChange={handleEditClick}
                    isLoading={showSkeleton}
                />
            </div>

            <div className="prompt-area">
                <input
                    id="prompt"
                    type="text"
                    placeholder={isLoading ? "Подождите..." : "Спланируй мой день..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiSend()}
                    disabled={isLoading}
                />
                <button onClick={handleAiSend} disabled={isLoading}>
                    {isLoading ? "Thinking..." : "Send AI"}
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title={editingTask ? "Редактировать задачу" : "Добавить задачу"}
            >
                <ManualTaskForm
                    key={editingTask?.id || "new-task"}
                    initialData={editingTask}
                    onSubmit={(data: TaskFormData) => {
                        if (editingTask) {
                            handleTaskChange({ ...data, id: editingTask.id, completed: editingTask.completed } as Task);
                        } else {
                           void addManualTask(data);
                        }
                        closeModal();
                    }}
                    onCancel={() => setModalOpen(false)}
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    onSelect={handleJumpToDate}
                />
            </Modal>
        </div>
    );
}

export default App;
