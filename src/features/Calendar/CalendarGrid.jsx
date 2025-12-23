import React from "react";

const CalendarGrid = ({ tasks, daysInMonth, startDayOffset }) => {
  const blanks = Array.from({ length: startDayOffset - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="calendar-grid">
      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
        <div key={d} className="weekday-header">
          {d}
        </div>
      ))}

      {blanks.map((_, i) => (
        <div key={`blank-${i}`} className="day-cell empty" />
      ))}

      {days.map((day) => {
        const dayTasks = tasks.filter((t) => t.day === day);
        return (
          <div key={day} className="day-cell">
            <span className="day-number">{day}</span>
            <div className="tasks-dots">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`dot priority-${task.priority}`}
                  title={task.title}
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
