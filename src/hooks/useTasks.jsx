import { useEffect, useState } from "react";
import { fetchTasks, createTask, generateTasksAI } from "../services/api";

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  const generateFromPrompt = async (prompt, dateContext) => {
    setIsLoading(true);
    setError(null);
    try {
      const newTasks = await generateTasksAI(prompt);

      const year = dateContext.getFullYear();
      const month = dateContext.getMonth() + 1;

      const tasksWithFullDate = newTasks.map((t) => ({
        ...t,

        date: `${year}-${month.toString().padStart(2, "0")}-${t.day.toString().padStart(2, "0")}`,
      }));

      setTasks((prev) => [...prev, ...tasksWithFullDate]);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError("Не удалось сгенерировать задачи. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const addManualTask = async (taskData) => {
    try {
      setIsLoading(true);
      const newSavedTask = await createTask(taskData);

      setTasks((prev) => [...prev, newSavedTask]);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { tasks, isLoading, error, generateFromPrompt, addManualTask };
};
