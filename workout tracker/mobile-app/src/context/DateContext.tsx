import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

interface DateItem {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
  isComplete: boolean;
}

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  dates: DateItem[];
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  formattedDate: string;
  weekNumber: number;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

// Generate dates for the scroller (30 days before and 14 days after today)
function generateDates(selectedDate: Date): DateItem[] {
  const dates: DateItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = -30; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    dates.push({
      date,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      isToday: i === 0,
      isSelected: date.toDateString() === selectedDate.toDateString(),
      hasWorkout: date.getDay() !== 0, // Example: no workout on Sunday
      isComplete: i < 0 && date.getDay() !== 0, // Past days (except Sunday) are complete
    });
  }
  
  return dates;
}

// Calculate week number of the year
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

interface DateProviderProps {
  children: ReactNode;
}

export function DateProvider({ children }: DateProviderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const dates = useMemo(() => generateDates(selectedDate), [selectedDate]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const isToday = useMemo(() => 
    selectedDate.toDateString() === today.toDateString(), 
    [selectedDate, today]
  );

  const isFuture = useMemo(() => 
    selectedDate.getTime() > today.getTime(), 
    [selectedDate, today]
  );

  const isPast = useMemo(() => 
    selectedDate.getTime() < today.getTime(), 
    [selectedDate, today]
  );

  const formattedDate = useMemo(() => {
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate, isToday, today]);

  const weekNumber = useMemo(() => getWeekNumber(selectedDate), [selectedDate]);

  const handleSetSelectedDate = useCallback((date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  }, []);

  const value: DateContextType = {
    selectedDate,
    setSelectedDate: handleSetSelectedDate,
    dates,
    isToday,
    isFuture,
    isPast,
    formattedDate,
    weekNumber,
  };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate(): DateContextType {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}

export default DateContext;

