import { QueryClient } from "@tanstack/react-query";

const BASE_URL = "https://posttracheal-beckie-lithographical.ngrok-free.dev";

const headers = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

export const fetchTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return await response.json();
};

export const generateTasksAI = async (text) => {
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

export const queryClient = new QueryClient();

export const createTask = async (taskData) => {
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
