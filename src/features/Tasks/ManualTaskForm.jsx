import { useState } from "react";

const ManualTaskForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [day, setDay] = useState(new Date().getDate());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    onSubmit({
      title,
      start_time: time || null,
      day: Number(day),
      duration_minutes: 60,
      priority: "low",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <input
        autoFocus
        type="text"
        placeholder="Название задачи"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="row">
        <input
          type="number"
          placeholder="День"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          min="1"
          max="31"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div className="actions">
        <button type="button" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="primary">
          Создать
        </button>
      </div>
    </form>
  );
};

export default ManualTaskForm;
