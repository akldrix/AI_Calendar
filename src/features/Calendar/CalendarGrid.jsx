// src/features/Calendar/CalendarGrid.jsx
import React from "react";

const CalendarGrid = ({ tasks }) => {
  // Генерируем массив дней [1, 2, ..., 31]
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="calendar-grid">
      {days.map((day) => {
        // Фильтруем задачи конкретно для этого дня
        // (В реальном проекте используй полную дату YYYY-MM-DD)
        const dayTasks = tasks.filter((t) => t.day === day);

        return (
          <div key={day} className="day-cell">
            <span className="day-number">{day}</span>

            <div className="tasks-dots">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`dot priority-${task.priority}`}
                  title={`${task.start_time} - ${task.title}`} // Подсказка при наведении
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
