export const generateTasksAI = async (prompt) => {
  console.log("AI Generation Prompt:", prompt);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      title: "Встреча с командой по проекту 'Феникс'",
      day: 15,
      priority: "high",
    },
    { title: "Подготовить квартальный отчет", day: 18, priority: "medium" },
    { title: "Записаться к врачу", priority: "low" },
    { title: "Купить билеты в театр на следующей неделе", day: 22 },
  ];
};
