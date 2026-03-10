import React, { useMemo, useState } from "react";
import { Popover } from "antd";
import "../../styles/main.css";
const CalendarGrid = ({
  tasks,
  daysInMonth,
  startDayOffset,
  currentDate,
  onSelect,
  selectedDate,
  prevDaysInMonth,
  prevMonth,
  nextMonth,
  endDay,
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

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevDays = Array.from({ length: startDayOffset - 1 }, (_, i) => {
    return prevDaysInMonth - (startDayOffset - 1) + 1 + i;
  });
  const totalDisplayed = prevDays.length + days.length;
  const remainingDays = totalDisplayed % 7 === 0 ? 0 : 7 - (totalDisplayed % 7);
  const nextDays = Array.from({ length: remainingDays }, (_, i) => {
    return i + 1;
  });
  const formatDate = (dayNum) => {
    return `${year}-${month.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
  };
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  const formatPrevDate = (dayNum) => {
    return `${previousYear}-${previousMonth.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
  };
  const nextYear = month === 1 ? year + 1 : year;
  const nextMonthStr = month === 1 ? 12 : month + 1;
  const formatNextDate = (dayNum) => {
    return `${nextYear}-${nextMonthStr.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
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
  const isCurrent =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentCell = today.getDate();
  const tasksByDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      const d = new Date(task.date);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(task);
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

      {prevDays.map((day, i) => {
        const prevDayString = formatPrevDate(day);
        const dayTasks = tasksByDay.get(prevDayString) || [];
        const undoneTasks = dayTasks.filter((task) =>
          !task.completed ? task : null,
        );
        const maxDots = 4;
        return (
          <div key={`prev-${i}`} className="day-cell prev">
            <span className="day-number grey">{day}</span>
            <div>
              <div className="tasks-dots">
                {undoneTasks.slice(0, maxDots).map((task) => (
                  <div key={task.id} className={`dot grey`} />
                ))}
                {undoneTasks.length > maxDots && (
                  <span className="more-count">
                    +{undoneTasks.length - maxDots}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {days.map((day) => {
        const dateString = formatDate(day);
        const dayTasks = tasksByDay.get(dateString) || [];
        const undoneTasks = dayTasks.filter((task) =>
          !task.completed ? task : null,
        );
        const maxDots = 4;

        const isToday = isCurrent && day === currentCell;
        const isSelected = dateString === selectedDate;

        const cellClasses = [
          "day-cell",
          isToday ? "today-cell" : "",
          isSelected ? "selected-cell" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <Popover
            key={day}
            mouseEnterDelay={0.6}
            mouseLeaveDelay={0.2}
            styles={{ container: { backgroundColor: "var(--popover-bg)" } }}
            placement="bottomRight"
            title={`Задачи на ${day} ${getMonthGenitive(month)}`}
            content={renderPopoverContent(undoneTasks)}
            arrow={mergedArrow}
            trigger="hover"
          >
            <div className={cellClasses} onClick={() => onSelect(dateString)}>
              <span className={isToday ? "selected-number" : "day-number"}>
                {day}
              </span>
              <div className="tasks-dots">
                {undoneTasks.slice(0, maxDots).map((task) => (
                  <div
                    key={task.id}
                    className={`dot category-${task.category} `}
                  />
                ))}
                {undoneTasks.length > maxDots && (
                  <span className={isToday ? "more-today" : "more-count"}>
                    +{undoneTasks.length - maxDots}
                  </span>
                )}
              </div>
            </div>
          </Popover>
        );
      })}
      {nextDays.map((day, i) => {
        const nextDayString = formatNextDate(day);
        const dayTasks = tasksByDay.get(nextDayString) || [];
        const undoneTasks = dayTasks.filter((task) =>
          !task.completed ? task : null,
        );
        const maxDots = 4;
        return (
          <div key={`prev-${i}`} className="day-cell prev">
            <span className="day-number grey">{day}</span>
            <div>
              <div className="tasks-dots">
                {undoneTasks.slice(0, maxDots).map((task) => (
                  <div key={task.id} className={`dot grey`} />
                ))}
                {undoneTasks.length > maxDots && (
                  <span className="more-count">
                    +{undoneTasks.length - maxDots}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
