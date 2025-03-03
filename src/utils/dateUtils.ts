/**
 * Formats a date to a relative time string (e.g., "2 hours ago", "just now", "yesterday")
 * @param date The date to format
 * @returns A string representing the relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Just now (less than a minute ago)
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return 'yesterday';
  }
  
  // Days (up to a week)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // Weeks (up to a month)
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Months (up to a year)
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  // Years
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Formats a date to a short date string (e.g., "Jan 1, 2023")
 * @param date The date to format
 * @returns A string representing the short date
 */
export function formatShortDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  return date.toLocaleDateString(undefined, options);
}

/**
 * Formats a date to a time string (e.g., "2:30 PM")
 * @param date The date to format
 * @returns A string representing the time
 */
export function formatTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true
  };
  return date.toLocaleTimeString(undefined, options);
}

/**
 * Formats a date to a date and time string (e.g., "Jan 1, 2023 at 2:30 PM")
 * @param date The date to format
 * @returns A string representing the date and time
 */
export function formatDateTime(date: Date): string {
  return `${formatShortDate(date)} at ${formatTime(date)}`;
} 