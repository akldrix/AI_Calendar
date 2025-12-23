import { useState } from "react";
import { generateTasksAI } from "../utils/ai";

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateFromPrompt = async (prompt, dateContext) => {
    setIsLoading(true);
    try {
      const newTasks = await generateTasksAI(prompt);

      const year = dateContext.getFullYear();
      const month = dateContext.getMonth();

      const tasksWithFullDate = newTasks.map((t) => ({
        ...t,

        day: t.day || dateContext.getDate(),
        month: month,
        year: year,
      }));

      setTasks((prev) => [...prev, ...tasksWithFullDate]);
    } catch (err) {
      console.error("Ошибка при генерации задач с помощью AI:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addManualTask = (taskData) => {
    const newTask = {
      ...taskData,
      id: crypto.randomUUID(),
      priority: taskData.priority || "medium",
    };
    setTasks((prev) => [...prev, newTask]);
  };

  return { tasks, isLoading, generateFromPrompt, addManualTask };
};
