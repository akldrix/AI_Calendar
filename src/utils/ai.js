/**
 * Имитирует вызов API к нейросети для генерации задач.
 * @param {string} prompt - Текстовый запрос от пользователя.
 * @returns {Promise<Array<{title: string, day?: number, priority?: 'high' | 'medium' | 'low'}>>}
 */
export const generateTasksAI = async (prompt) => {
  console.log("AI Generation Prompt:", prompt);

  // Имитируем задержку сети, как будто мы обращаемся к реальному API
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Возвращаем заранее подготовленные данные.
  // В реальном приложении здесь будет вызов fetch() к вашему бэкенду или стороннему API.
  // Обратите внимание: AI может вернуть день, а может и не вернуть. Ваш хук useTasks это уже обрабатывает.
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
