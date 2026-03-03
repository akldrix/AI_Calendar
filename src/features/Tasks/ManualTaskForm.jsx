import { useState, useEffect } from "react";
import { Select } from "antd";
import { Popover } from "antd";

const ManualTaskForm = ({ onSubmit, onCancel, currentDate, daysInMonth }) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [day, setDay] = useState(new Date().getDate());
  const [category, setCategory] = useState("");
  const [isCategoryInvalid, setIsCategoryInvalid] = useState(false);

  const options = [
    { value: "home", label: "Дом" },
    { value: "work", label: "Работа" },
    { value: "self", label: "Саморазвитие" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    if (!category) {
      setIsCategoryInvalid(true);
      return;
    }

    setIsCategoryInvalid(false);

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
useEffect(() => {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onCancel();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => {
     document.removeEventListener('keydown', handleKeyDown);
  };
}, [onCancel]);
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
          max={daysInMonth}
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
        <Popover
          content="Пожалуйста, выберите категорию"
          color="#fff1f0"
          overlayInnerStyle={{ color: "#ff4d4f" }}
          open={isCategoryInvalid}
          placement="right"
        >
          <Select
            status={isCategoryInvalid ? "error" : ""}
            style={{
              backgroundColor: "var(--input-bg)",
              width: "100%",
              marginBottom: "10px",
              padding: "8px",
              boxSizing: "border-box",
            }}
            allowClear
            options={options}
            placeholder="Категория"
            onInputKeyDown={(e) => {
              if (e.key === "Enter" && category) {
                handleSubmit(e);
              }
            }}
            onChange={(value) => {
              setCategory(value);
              if (value) setIsCategoryInvalid(false);
            }}
            onFocus={() => setIsCategoryInvalid(false)}
            popupClassName="select-dropdown"
          />
        </Popover>
      </div>
      <div className="actions">
        <button type="button" onClick={onCancel}>
          Отмена
        </button>

        <button
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
