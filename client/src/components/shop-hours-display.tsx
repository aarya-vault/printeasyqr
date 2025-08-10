import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface WorkingHoursData {
  open: string;
  close: string;
  closed: boolean;
  is24Hours?: boolean;
}

interface ShopHoursDisplayProps {
  workingHours: Record<string, WorkingHoursData>;
  compact?: boolean;
  showToday?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ShopHoursDisplay({ workingHours, compact = false, showToday = false }: ShopHoursDisplayProps) {
  const today = new Date().getDay();
  const todayKey = DAYS[today === 0 ? 6 : today - 1]; // Adjust for Sunday = 0
  
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusForDay = (dayKey: string) => {
    const hours = workingHours[dayKey];
    if (!hours || hours.closed) {
      return { status: 'Closed', className: 'bg-gray-200 text-gray-600' };
    }
    if (hours.is24Hours) {
      return { status: 'Open 24 Hours', className: 'bg-green-500 text-white' };
    }
    return { 
      status: `${formatTime(hours.open)} - ${formatTime(hours.close)}`, 
      className: 'bg-brand-yellow text-rich-black' 
    };
  };

  if (showToday) {
    const todayStatus = getStatusForDay(todayKey);
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Today:</span>
        <Badge className={todayStatus.className}>
          {todayStatus.status}
        </Badge>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {DAYS.map((dayKey, index) => {
          const status = getStatusForDay(dayKey);
          const isToday = dayKey === todayKey;
          
          return (
            <div key={dayKey} className={`flex items-center justify-between text-sm ${isToday ? 'font-semibold' : ''}`}>
              <span className={isToday ? 'text-brand-yellow' : 'text-gray-600'}>
                {DAY_NAMES[index]}:
              </span>
              <Badge variant="outline" className={`${status.className} text-xs`}>
                {status.status}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {DAYS.map((dayKey, index) => {
        const status = getStatusForDay(dayKey);
        const isToday = dayKey === todayKey;
        
        return (
          <div key={dayKey} className={`flex items-center justify-between p-3 rounded-lg border ${isToday ? 'border-brand-yellow bg-brand-yellow/5' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={`font-medium ${isToday ? 'text-brand-yellow' : 'text-gray-700'}`}>
                {DAY_NAMES[index]}
              </span>
              {isToday && (
                <Badge variant="outline" className="text-xs border-brand-yellow text-brand-yellow">
                  Today
                </Badge>
              )}
            </div>
            <Badge className={status.className}>
              {status.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export default ShopHoursDisplay;