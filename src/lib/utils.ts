import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = "";
  if (days > 0) {
    result += `${days}d `;
  }
  result += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  return result.trim();
}

export function formatDateTime(date: Date, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };
  
  try {
    let formattedDate = new Intl.DateTimeFormat(locale, options).format(date);
    if (locale === 'he') {
        // Manual replacement for Hebrew AM/PM
        formattedDate = formattedDate.replace('PM', 'אחה״צ').replace('AM', 'לפנה״צ');
    }
    return formattedDate;
  } catch (e) {
    console.error(`Failed to format date for locale: ${locale}`, e);
    // Fallback to a default locale
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
}
