// src/utils/dateHelpers.js

// ============ DATE FORMATTING ============
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  switch(format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'medium':
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    case 'time':
      return d.toLocaleTimeString();
    case 'datetime':
      return d.toLocaleString();
    case 'iso':
      return d.toISOString();
    default:
      return d.toLocaleDateString();
  }
};

// ============ DATE COMPARISON ============
export const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

export const isYesterday = (date) => {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  return yesterday.toDateString() === checkDate.toDateString();
};

export const isTomorrow = (date) => {
  if (!date) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkDate = new Date(date);
  return tomorrow.toDateString() === checkDate.toDateString();
};

export const isPastDate = (date) => {
  if (!date) return false;
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkDate < today;
};

export const isFutureDate = (date) => {
  if (!date) return false;
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkDate > today;
};

export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

// ============ DATE CALCULATIONS ============
export const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// ============ MEMBERSHIP STATUS ============
export const getMembershipStatus = (endDate) => {
  if (!endDate) return 'Inactive';
  const daysLeft = getDaysRemaining(endDate);
  
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 7) return 'Expiring Soon';
  return 'Active';
};

export const getMembershipStatusColor = (status) => {
  switch(status) {
    case 'Active': return '#4caf50';
    case 'Expiring Soon': return '#ff9800';
    case 'Expired': return '#f44336';
    default: return '#9e9e9e';
  }
};

// ============ RELATIVE TIME ============
export const timeAgo = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
};

// ============ DATE RANGE HELPERS ============
export const getWeekDaysBetween = (startDate, endDate) => {
  const days = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

export const getMonthDays = (year, month) => {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// ============ AGE CALCULATION ============
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ============ DATE VALIDATION ============
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

// ============ NEXT/PREVIOUS DATE ============
export const getNextDay = (date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
};

export const getPreviousDay = (date) => {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  return result;
};

// ============ START/END OF DAY ============
export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

// ============ WEEKDAY NAME ============
export const getWeekdayName = (date, short = false) => {
  if (!date) return '';
  const d = new Date(date);
  const options = { weekday: short ? 'short' : 'long' };
  return d.toLocaleDateString('en-US', options);
};

export const getMonthName = (date, short = false) => {
  if (!date) return '';
  const d = new Date(date);
  const options = { month: short ? 'short' : 'long' };
  return d.toLocaleDateString('en-US', options);
};