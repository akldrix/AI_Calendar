const BASE_URL = "http://localhost:3000";
//'https://posttracheal-beckie-lithographical.ngrok-free.dev'//
export const fetchTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return await response.json();
};

export const generateTasksAI = async (prompt) => {
  console.log("Отправка в ИИ: ", prompt);

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return [
    {
      id: crypto.randomUUID(),
      title: "Че-то сделать",
      start_time: "14:00",
      duration: "30",
      priority: "low",
      date: "2026-01-19",
    },
    {
      id: crypto.randomUUID(),
      title: "Че-то еще сделать",
      start_time: "19:00",
      duration: "90",
      priority: "high",
      date: "2026-01-22",
    },
  ];
};
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
