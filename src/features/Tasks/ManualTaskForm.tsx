import React, {useEffect, useRef, useState} from "react";
import {Popover, Radio} from "antd";
import {Category, type Task, type TaskFormData} from "../../types.ts";

interface ManualTaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  currentDate: Date;
  initialData?: Task | null;
  selectedDate: string;
  onSelect: (date: string) => void;
}

const ManualTaskForm = ({
  onSubmit,
  onCancel,
  currentDate,
  initialData,
  selectedDate,
  onSelect,
}: ManualTaskFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [time, setTime] = useState(initialData?.start_time || "");
  const [endTime, setEndTime] = useState(initialData?.end_time || "");
  const [category, setCategory] = useState<Category | "">(initialData?.category || "");
  const [isCategoryInvalid, setIsCategoryInvalid] = useState(false);
  const initialDateObj = initialData?.date ? new Date(initialData.date) : new Date(selectedDate);

  const [year, setYear] = useState(initialDateObj.getFullYear());
  const [month, setMonth] = useState(initialDateObj.getMonth());
  const [day, setDay] = useState(initialDateObj.getDate());

  const monthForUrl = month + 1;
  const formattedDate = `${year}-${monthForUrl.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  const maxDays = new Date(year, monthForUrl, 0).getDate();
  const options = [
    { value: Category.Home, label: "Дом" },
    { value: Category.Work, label: "Работа" },
    { value: Category.Self, label: "Личное" },
  ];
  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!title.trim() ) return;
    if (!category) {
      setIsCategoryInvalid(true);
      return;
    }

    onSelect(formattedDate);
const taskData: TaskFormData = {
    ...initialData,
          title,
          start_time: time,
          end_time: endTime,
          date: formattedDate,
          category: category as Category,
          completed: initialData?.completed ?? false,
          description: initialData?.description ?? "",
    };
    onSubmit(taskData);
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
  const submitBtnRef = useRef<HTMLButtonElement>(null);
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
          onChange={(e) => setDay(Number(e.target.value))}
          min="1"
          max={maxDays}
        />
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {months.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Год"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
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
              submitBtnRef.current?.focus();
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

        <button
          type="submit"
          className="primary"
          onClick={() => onSelect(formattedDate)}
          ref={submitBtnRef}
        >
          {initialData ? "Сохранить" : "Создать"}
        </button>
      </div>
    </form>
  );
};

export default ManualTaskForm;
