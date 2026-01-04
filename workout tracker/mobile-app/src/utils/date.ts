// Get the current week number of a 12-week training plan
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getCurrentWeekAndDay(): { week: number; day: string } {
  const now = new Date();
  const day = DAY_NAMES[now.getDay()];
  
  // For now, default to week 1 - in a real app this would be calculated
  // based on when the user started their program
  return { week: 1, day };
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export interface WeekDayInfo {
  day: string;
  dayShort: string;
  date: number;
  fullDate: Date;
  isToday: boolean;
}

export function getWeekDays(weekNumber: number): WeekDayInfo[] {
  const now = new Date();
  
  // Get today's info for comparison
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();
  
  // Find Monday of the current week
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // How many days since Monday
  
  // Create Monday of current week
  const mondayOfCurrentWeek = new Date(now);
  mondayOfCurrentWeek.setDate(now.getDate() - daysFromMonday);
  mondayOfCurrentWeek.setHours(0, 0, 0, 0);
  
  // Offset by week number (week 1 = current week)
  const weekOffset = (weekNumber - 1) * 7;
  
  return WEEK_DAYS.map((day, index) => {
    // Calculate the date for this day
    const dayDate = new Date(mondayOfCurrentWeek);
    dayDate.setDate(mondayOfCurrentWeek.getDate() + weekOffset + index);
    
    const isToday = 
      dayDate.getDate() === todayDate &&
      dayDate.getMonth() === todayMonth &&
      dayDate.getFullYear() === todayYear;
    
    return {
      day,
      dayShort: day.charAt(0),
      date: dayDate.getDate(),
      fullDate: dayDate,
      isToday,
    };
  });
}
