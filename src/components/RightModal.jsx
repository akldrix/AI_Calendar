import React from "react";
import "../styles/right-modal.css"; 

const RightModal = ({ selectedDate, tasks }) => {
  if (!selectedDate) return <div className="right-modal-empty">Выберите день</div>;

  const todayTasks = tasks.filter((task) => task.date === selectedDate);

  const getNextDayString = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1); 
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const nextDayString = getNextDayString(selectedDate);
  const tomorrowTasks = tasks.filter((task) => task.date === nextDayString);

  return (
    <div className="right-modal-content">
      <div className="task-group">
        <h3>Дата: <span>{selectedDate}</span></h3>
        {todayTasks.length > 0 ? (
        
          <ul className="task-list">
            {todayTasks.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((task) => (
              <li key={task.id} className={`task-item priority-${task.priority}`}>
                  {!task.start_time ? task.title : `${task.start_time} — ${task.title}` }
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-tasks">Нет задач</p>
        )}
      </div>

      <div className="divider"></div>

      <div className="task-group">
        <h3>Следующий день: <span>{nextDayString}</span></h3>
        {tomorrowTasks.length > 0 ? (
          <ul className="task-list">
            {tomorrowTasks.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((task) => (
              <li key={task.id} className="task-item faded">
                  {!task.start_time ? task.title : `${task.start_time} — ${task.title}` }
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-tasks">Нет планов на завтра</p>
        )}
      </div>
    </div>
  );
};

export default RightModal;