import { useEffect, useState } from "react";
import { fetchTasks, createTask, generateTasksAI } from "../services/api";

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

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

  const generateFromPrompt = async (text) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateTasksAI(text);



      setTasks((prev) => [...prev, response]);
      return true;
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
      const newSavedTask = await createTask({ ...taskData, completed: false });

      setTasks((prev) => [...prev, newSavedTask]);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tasks,
    isLoading,
    error,
    generateFromPrompt,
    addManualTask,
    toggleTask,
  };
};
