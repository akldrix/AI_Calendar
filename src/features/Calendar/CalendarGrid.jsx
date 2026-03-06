import React, { useMemo, useState } from "react";
import { Popover } from "antd";
import "../../styles/main.css";
const CalendarGrid = ({
  tasks,
  daysInMonth,
  startDayOffset,
  currentDate,
  onSelect,
  selectedDate
}) => {
  const [arrow, setArrow] = useState("Show");
  const mergedArrow = useMemo(() => {
    if (arrow === "Hide") {
      return false;
    }
    if (arrow === "Show") {
      return true;
    }
    return {
      pointAtCenter: true,
    };
  }, [arrow]);
  const renderPopoverContent = (dayTasks) => (
    <div>
      {dayTasks.length > 0
        ? dayTasks.map((t) => <div key={t.id}>• {t.title}</div>)
        : "Нет задач"}
    </div>
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const blanks = Array.from({ length: startDayOffset - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDate = (dayNum) => {
    return `${year}-${month.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
  };
  function getMonthGenitive(monthNumber) {
    const index = monthNumber - 1;
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    return months[index];
  }
  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentCell = today.getDate();
  const tasksByDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      const taskDate = new Date(task.date);
      if (
        taskDate.getFullYear() === year &&
        taskDate.getMonth() + 1 === month
      ) {
        const dayNum = taskDate.getDate();
        if (!map.has(dayNum)) {
          map.set(dayNum, []);
        }
        map.get(dayNum).push(task);
      }
    });
    return map;
  }, [tasks, year, month]);

  return (
    <div className="calendar-grid">
      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
        <div key={d} className="weekday-header">
          {d}
        </div>
      ))}

      {blanks.map((_, i) => (
        <div key={`blank-${i}`} className="empty" />
      ))}

      {days.map((day) => {
        const dayTasks = tasksByDay.get(day) || [];
        const maxDots = 4;
        const dateString = formatDate(day);
const isToday = isCurrent && day === currentCell;
const isSelected = dateString === selectedDate;

const cellClasses = ["day-cell", isToday ? "today-cell" : "", isSelected ? "selected-cell" : ""].filter(Boolean).join(" ");
        return (
          <Popover
            key={day}
            styles={{ container: { backgroundColor: "var(--popover-bg)" } }}
            placement="bottomRight"
            title={`Задачи на ${day} ${getMonthGenitive(month)}`}
            content={renderPopoverContent(dayTasks)}
            arrow={mergedArrow}
            trigger="hover"
          >
            <div className={cellClasses} onClick={() => onSelect(dateString)}>
              <span className="day-number">{day}</span>
              <div className="tasks-dots">
                {dayTasks.slice(0, maxDots).map((task) => (
                  <div
                    key={task.id}
                    className={`dot category-${task.category} `}
                  />
                ))}
                {dayTasks.length > maxDots && (
                  <span className="more-count">
                    +{dayTasks.length - maxDots}
                  </span>
                )}
              </div>
            </div>
          </Popover>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
