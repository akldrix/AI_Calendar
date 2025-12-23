
import { useState } from "react";

export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();


  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();


  let startDay = new Date(year, currentDate.getMonth(), 1).getDay();
  if (startDay === 0) startDay = 7;

  const nextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  return {
    currentDate,
    monthName,
    year,
    daysInMonth,
    startDay, 
    nextMonth,
    prevMonth,
  };
};
