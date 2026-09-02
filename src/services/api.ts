import { QueryClient } from "@tanstack/react-query";
import  type { Task, CreateTaskInput } from "../types.ts";

const BASE_URL = "/api";
// "https://posttracheal-beckie-lithographical.ngrok-free.dev";//

const headers = {
  "Content-Type": "application/json",
};

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return await response.json();
};

export const generateTasksAI = async (text: string): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/tasks/from-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text }),
  });

  if (!response.ok) {
    throw new Error(`Failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const createTask = async (taskData: CreateTaskInput & { completed: boolean }): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error("Failed to create task");
  }
  return await response.json();
};
export const toggleTaskCompleteness = async (task: Task): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    throw new Error(`Failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};
export const deleteTask = async (task: Task): Promise<void> => {
  const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed: ${response.status} ${response.statusText}`);
  }
};
export const changeTask = async (task:Task): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    throw new Error(`Failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};
