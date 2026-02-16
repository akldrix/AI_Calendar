import { useState } from "react";
import CalendarGrid from "./features/Calendar/CalendarGrid";
import Modal from "./components/Modal";
import ManualTaskForm from "./features/Tasks/ManualTaskForm";
import RightModal from "./components/RightModal";
import { useCalendar } from "./hooks/useCalendar";
import { useTasks } from "./hooks/useTasks";

import "./styles/main.css";

function App() {
  const {
    currentDate,
    monthName,
    year,
    daysInMonth,
    startDay,
    nextMonth,
    prevMonth,
  } = useCalendar();

  const { tasks, isLoading, generateFromPrompt, addManualTask } = useTasks();

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

  const handleAiSend = () => {
    if (!prompt.trim()) return;
    generateFromPrompt(prompt, currentDate);
    setPrompt("");
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
        <div className="header-controls">
          <button onClick={prevMonth}>&lt;</button>
          <button onClick={nextMonth}>&gt;</button>
          <button className="add-btn" onClick={() => setModalOpen(true)}>
            + Задача
          </button>
        </div>
      </header>
      <div>
        <CalendarGrid
          tasks={tasks}
          daysInMonth={daysInMonth}
          startDayOffset={startDay}
          currentDate={currentDate}
          onSelect={setSelectedDate}
        />
        <RightModal selectedDate={selectedDate} tasks={tasks} />
      </div>
      <div className="prompt-area">
        <input
          type="text"
          placeholder="AI промпт: Спланируй мой день..."
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
        title="Добавить задачу вручную"
      >
        <ManualTaskForm
          onSubmit={(data) => {
            addManualTask(data);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
          currentDate={currentDate}
        />
      </Modal>
    </div>
  );
}

export default App;
