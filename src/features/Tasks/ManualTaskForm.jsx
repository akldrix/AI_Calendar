import { useState } from "react";
import { Select } from "antd";

const ManualTaskForm = ({ onSubmit, onCancel, currentDate }) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [day, setDay] = useState(new Date().getDate());
  const [category, setCategory] = useState("");

  const options = [
    { value: "home", label: "Дом" },
    { value: "work", label: "Работа" },
    { value: "self", label: "Саморазвитие" },
  ];

  const handleChange = (event) => {
    setCategory(event.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !category) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    onSubmit({
      title,
      start_time: time,
      end_time: endTime,
      date: formattedDate,
      category: category,
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
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          min={time}
        />
        <Select
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "8px",
            boxSizing: "border-box",
          }}
          allowClear
          options={options}
          placeholder="Категория"
          onChange={(value) => setCategory(value)}
        />
      </div>
      <div className="actions">
        <button type="button" onClick={onCancel}>
          Отмена
        </button>

        <button
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          type="submit"
          className="primary"
        >
          Создать
        </button>
      </div>
    </form>
  );
};

export default ManualTaskForm;
