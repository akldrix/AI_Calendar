export const generateTasksAI =
async(prompt) => {
    console.log("Отправка в ИИ: ", prompt);


await new Promise(resolve =>
    setTimeout(resolve, 1500)
);
return [
    {
        id: crypto.randomUUID(),
        title: "Че-то сделать",
        start_time: "14:00",
        duration: "30",
        priority: "medium",
        date: "22"
    },
     {
        id: crypto.randomUUID(),
        title: "Че-то еще сделать",
        start_time: "19:00",
        duration: "90",
        priority: "high",
        date: "22"
    },
];
};