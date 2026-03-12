import { useState, useEffect } from "react";
import { Select } from "antd";
import { Popover } from "antd";
import { Radio } from "antd";

const ManualTaskForm = ({
  onSubmit,
  onCancel,
  currentDate,
  daysInMonth,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [time, setTime] = useState(initialData?.start_time || "");
  const [endTime, setEndTime] = useState(initialData?.end_time || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [isCategoryInvalid, setIsCategoryInvalid] = useState(false);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [day, setDay] = useState(() => {
    if (initialData?.date) return new Date(initialData.date).getDate();
    return new Date().getDate();
  });

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
    const monthForUrl = (month + 1).toString().padStart(2, "0");
    const formattedDate = `${year}-${monthForUrl.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    onSubmit({
      ...initialData,
      title,
      start_time: time,
      end_time: endTime,
      date: formattedDate,
      category: category,
    });
  };
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

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
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {months.map((month, index) => (
            <option key={index} value={index}>
              {month}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Год"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={2000}
        />
      </div>
      <div className="row">
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
      </div>
      <Popover
        content="Пожалуйста, выберите категорию"
        color="#fff1f0"
        overlayInnerStyle={{ color: "#ff4d4f" }}
        open={isCategoryInvalid}
        placement="right"
      >
        <Radio.Group
          value={category || undefined}
          onChange={(e) => {
            const value = e.target.value;
            setCategory(value);

            if (value) setIsCategoryInvalid(false);

            setTimeout(() => {
              const submitBtn = document.querySelector(
                ".task-form button.primary",
              );
              submitBtn?.focus();
            }, 0);
          }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            width: "100%",
            boxSizing: "border-box",
            padding: "4px",
            outline: isCategoryInvalid ? "1px solid #ff4d4f" : "none",
            borderRadius: "8px",
          }}
        >
          {options.map((option) => (
            <Radio.Button
              key={option.value}
              value={option.value}
              style={{
                textAlign: "center",
                borderRadius: "12px",
                border: "0 solid transparent",
                flex: "1 1 auto",
                height: "auto",
                lineHeight: "1.2",
                padding: "8px 12px",
                whiteSpace: "normal",
              }}
              className={
                option.value ? `radio category-${option.value}` : `radio:active`
              }
            >
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Popover>
      <div className="actions">
        <button type="button" onClick={onCancel}>
          Отмена
        </button>

        <button type="submit" className="primary">
          {initialData ? "Сохранить" : "Создать"}
        </button>
      </div>
    </form>
  );
};

export default ManualTaskForm;
