import {useMemo, useState} from "react";
interface UseCalendarReturn {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    monthName: string;
    year: number;
    daysInMonth: number;
    startDay: number;
    endDay: number;
    nextMonth: () => void;
    prevMonth: () => void;
    prevDaysInMonth: number;
}

export const useCalendar = ():UseCalendarReturn => {
    const [currentDate, setCurrentDate] = useState(new Date());
return useMemo(() => {
        const monthName = currentDate.toLocaleString("default", {
            month: "long",
        });
        const year = currentDate.getFullYear();

        const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();

        let startDay = new Date(year, currentDate.getMonth(), 1).getDay();
        if (startDay === 0) startDay = 7;
        let endDay = new Date(year, currentDate.getMonth() + 1, 0).getDay();
        if (endDay === 0) endDay = 7;
        const nextMonth = () => {
            setCurrentDate((cur) => new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
        };

        const prevMonth = () => {
            setCurrentDate((cur) => new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
        };
        const prevDaysInMonth = new Date(year, currentDate.getMonth(), 0).getDate();
        return {
            currentDate,
            setCurrentDate,
            monthName,
            year,
            daysInMonth,
            startDay,
            nextMonth,
            prevMonth,
            prevDaysInMonth,
            endDay,
        };
    }, [currentDate]);
};
