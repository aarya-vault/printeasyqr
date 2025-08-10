import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock } from 'lucide-react';

interface WorkingHoursData {
  open: string;
  close: string;
  closed: boolean;
  is24Hours: boolean;
}

interface WorkingHours24Props {
  workingHours: Record<string, WorkingHoursData>;
  onUpdate: (day: string, field: string, value: any) => void;
  title?: string;
  description?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WorkingHours24({ workingHours, onUpdate, title = "Working Hours", description = "Set your shop's operating hours for each day" }: WorkingHours24Props) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-brand-yellow" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {DAYS.map((day) => {
          const dayKey = day.toLowerCase();
          const hours = workingHours[dayKey] || { 
            open: '09:00', 
            close: '18:00', 
            closed: false, 
            is24Hours: false 
          };
          
          return (
            <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-24">
                <span className="font-semibold text-rich-black">{day}</span>
              </div>
              
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={!hours.closed}
                    onCheckedChange={(checked) => onUpdate(day, 'closed', !checked)}
                    className="data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow"
                  />
                  <span className="text-sm font-medium">Open</span>
                </div>
                
                {!hours.closed && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={hours.is24Hours || false}
                        onCheckedChange={(checked) => {
                          onUpdate(day, 'is24Hours', checked);
                          if (checked) {
                            onUpdate(day, 'open', '00:00');
                            onUpdate(day, 'close', '23:59');
                          }
                        }}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className="text-sm font-medium text-green-600">24/7</span>
                    </div>
                    
                    {hours.is24Hours ? (
                      <Badge className="bg-green-500 text-white font-bold">
                        Open 24 Hours
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => onUpdate(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500 font-medium">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => onUpdate(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </>
                )}
                
                {hours.closed && (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                    Closed
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default WorkingHours24;