import { useState, useEffect } from "react";
import CalendarGrid from "./features/Calendar/CalendarGrid";
import Modal from "./components/Modal";
import ManualTaskForm from "./features/Tasks/ManualTaskForm";
import RightModal from "./components/RightModal";
import { useCalendar } from "./hooks/useCalendar";
import { useTasks } from "./hooks/useTasks";
import { FilterCategory } from "./features/Tasks/FilterCategory";
import { MoonIcon } from "./components/Icons/Moon";
import { SunIcon } from "./components/Icons/Sun";
import { useHotkeys } from "react-hotkeys-hook";

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
    nextDaysInMonth,
  } = useCalendar();

  const {
    tasks,
    isLoading,
    generateFromPrompt,
    addManualTask,
    handleToggle,
    handleDeleteTask,
    handleTaskChange,
  } = useTasks();

  const toDateString = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  };

  const [selectedDate, setSelectedDate] = useState(toDateString(currentDate));
  const [isModalOpen, setModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [editingTask, setEditingTask] = useState(null);
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
  useHotkeys("alt+space, ctrl+t", () => {
    toggleTheme();
  });
    const toNextString = (date, direction) => {
        if (!date || isNaN(date)) return "";
        const nextDate = new Date(date);

        switch (direction) {
            case "right": nextDate.setDate(nextDate.getDate() + 1); break;
            case "left":  nextDate.setDate(nextDate.getDate() - 1); break;
            case "up":    nextDate.setDate(nextDate.getDate() - 7); break;
            case "down":  nextDate.setDate(nextDate.getDate() + 7); break;
            default:      nextDate.setDate(nextDate.getDate() + 1);
        }

        const year = nextDate.getFullYear();
        const month = String(nextDate.getMonth() + 1).padStart(2, "0");
        const day = String(nextDate.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    useHotkeys("left, right, up, down", (event) => {
    event.preventDefault();

    const direction = event.key.replace("Arrow", "").toLowerCase();

    setSelectedDate((prevSelected) => {
        const currentSelectedObj = new Date(prevSelected.replace(/-/g, "/"));
        const nextDateStr = toNextString(currentSelectedObj, direction);

        setCurrentDate(new Date(nextDateStr.replace(/-/g, "/")));

        return nextDateStr;
    });
}, {
    enableOnFormTags: true
}, [selectedDate]);



const handleJumpToDate = (dateString) => {
    const targetDate = new Date(dateString);

    setCurrentDate(targetDate);

    setSelectedDate(dateString);
  };

  const toggleCategory = (categoryId) => {
    setHiddenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };
  useHotkeys("shift+h", () => {
    toggleCategory("home");
  });
  useHotkeys("shift+w", () => {
    toggleCategory("work");
  });
  useHotkeys("shift+s", () => {
    toggleCategory("self");
  });

  useHotkeys("shift+right", () => {
    nextMonth();
  });
  useHotkeys("shift+left", () => {
    prevMonth();
  });
  const handleAiSend = () => {
    if (!prompt.trim()) return;
    generateFromPrompt(prompt, currentDate);
    setPrompt("");
  };
  useHotkeys("ctrl+a", () => {
    setModalOpen(true);
  });
  const handleEditClick = (task) => {
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
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
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
          endDay={endDay}
          currentDate={currentDate}
          onSelect={setSelectedDate}
          selectedDate={selectedDate}
          prevDaysInMonth={prevDaysInMonth}
          nextDaysInMonth={nextDaysInMonth}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
        />
        <RightModal
          selectedDate={selectedDate}
          tasks={filteredTasks}
          onToggleTask={handleToggle}
          onDelete={handleDeleteTask}
          taskChange={handleEditClick}
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
          onSubmit={(data) => {
            if (editingTask) {
              handleTaskChange(data);
            } else {
              addManualTask(data);
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
