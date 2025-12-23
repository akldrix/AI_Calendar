import { useState } from "react";
import CalendarGrid from "./features/Calendar/CalendarGrid";
import { generateTasksAI } from "./services/api";
import "./styles/main.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const newTasks = await generateTasksAI(prompt);
      setTasks((prev) => [...prev, ...newTasks]);
      setPrompt("");
    } catch (error) {
      console.error(error);
      alert("Ошибка AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>
          AI Календарь <span style={{ fontSize: "0.5em" }}>Декабрь 2025</span>
        </h1>
      </header>

      {/* Сетка календаря, куда мы передаем задачи */}
      <CalendarGrid tasks={tasks} />

      {/* Зона промпта (как на твоем макете снизу) */}
      <div className="prompt-area">
        <input
          type="text"
          placeholder="Например: Спланируй подготовку к экзамену..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
