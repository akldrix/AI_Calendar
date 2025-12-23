import React, { useMemo } from "react";

const CalendarGrid = ({ tasks, daysInMonth, startDayOffset }) => {
  const blanks = Array.from({ length: startDayOffset - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);


  const tasksByDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!map.has(task.day)) {
        map.set(task.day, []);
      }
      map.get(task.day).push(task);
    });
    return map;
  }, [tasks]);

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
        
        const dayTasks = tasksByDay.get(day) || [];
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
