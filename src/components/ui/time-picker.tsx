'use client';
import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import FloatingLabelInput from './floating-label-input';
import CustomCheckbox from './radio-custom';
import { Label } from './label';

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const intl = useIntl();
  const isRTL = intl.locale === 'he';

  const getAmPm = (d: Date | undefined) => d && d.getHours() >= 12 ? 'PM' : 'AM';
  const getHour12 = (d: Date | undefined) => d ? String(d.getHours() % 12 || 12) : '1';

  const [amPm, setAmPm] = useState<'AM' | 'PM'>(getAmPm(date));
  const [hour, setHour] = useState<string>(getHour12(date));
  const [minute, setMinute] = useState<string>(date ? String(date.getMinutes()) : '0');
  const [second, setSecond] = useState<string>(date ? String(date.getSeconds()) : '0');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!date) return;
    const newAmPm = getAmPm(date);
    const newHour = getHour12(date);
    const newMinute = String(date.getMinutes());
    const newSecond = String(date.getSeconds());
    
    if(newAmPm !== amPm) setAmPm(newAmPm);
    if(newHour !== hour) setHour(newHour);
    if(newMinute !== minute) setMinute(newMinute);
    if(newSecond !== second) setSecond(newSecond);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleTimeChange = (type: 'hour' | 'minute' | 'second' | 'ampm', value: string) => {
    const newDate = date ? new Date(date) : new Date();
    
    let newHour12 = parseInt(hour, 10);
    let newMinute = parseInt(minute, 10);
    let newSecond = parseInt(second, 10);
    let newAmPm = amPm;

    switch (type) {
        case 'hour':
            newHour12 = parseInt(value, 10) || 0;
            if(newHour12 < 1) newHour12 = 1;
            if(newHour12 > 12) newHour12 = 12;
            setHour(value);
            break;
        case 'minute':
            newMinute = parseInt(value, 10) || 0;
            if(newMinute < 0) newMinute = 0;
            if(newMinute > 59) newMinute = 59;
            setMinute(value);
            break;
        case 'second':
            newSecond = parseInt(value, 10) || 0;
            if(newSecond < 0) newSecond = 0;
            if(newSecond > 59) newSecond = 59;
            setSecond(value);
            break;
        case 'ampm':
            newAmPm = value as 'AM' | 'PM';
            setAmPm(newAmPm);
            break;
    }

    if (type !== 'hour' && (parseInt(hour, 10) < 1 || parseInt(hour, 10) > 12)) newHour12 = 1;
    
    // Recalculate 24-hour format
    let finalHour24 = newHour12;
    if (newAmPm === 'PM' && newHour12 < 12) {
      finalHour24 = newHour12 + 12;
    }
    if (newAmPm === 'AM' && newHour12 === 12) {
      finalHour24 = 0; // Midnight
    }

    newDate.setHours(finalHour24, newMinute, newSecond);
    setDate(newDate);
  };
  
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center p-2 rounded-lg bg-input min-h-[68px]">
        Loading...
      </div>
    );
  }

  const handleNumberBlur = (type: 'hour' | 'minute' | 'second') => (e: React.FocusEvent<HTMLInputElement>) => {
      let value = parseInt(e.target.value, 10) || 0;
      if (type === 'hour') {
          if (value < 1) value = 1;
          if (value > 12) value = 12;
          setHour(String(value));
      } else {
          if(value < 0) value = 0;
          if(value > 59) value = 59;
          if(type === 'minute') setMinute(String(value));
          if(type === 'second') setSecond(String(value));
      }
  }

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            <FloatingLabelInput
                label={intl.formatMessage({ id: 'time.hours' })}
                value={hour}
                onValueChange={(val) => handleTimeChange('hour', val)}
                onBlur={handleNumberBlur('hour')}
                type="number"
                isRTL={isRTL}
            />
        </div>
        <div className="space-y-2">
            <FloatingLabelInput
                label={intl.formatMessage({ id: 'time.minutes' })}
                value={minute}
                onValueChange={(val) => handleTimeChange('minute', val)}
                onBlur={handleNumberBlur('minute')}
                type="number"
                isRTL={isRTL}
            />
        </div>
        <div className="space-y-2">
            <FloatingLabelInput
                label={intl.formatMessage({ id: 'time.seconds' })}
                value={second}
                onValueChange={(val) => handleTimeChange('second', val)}
                onBlur={handleNumberBlur('second')}
                type="number"
                isRTL={isRTL}
            />
        </div>
        <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
            <Label>{intl.formatMessage({ id: 'time.meridiem' })}</Label>
            <CustomCheckbox 
                options={[
                    { value: 'AM', label: intl.formatMessage({ id: 'time.am' }) },
                    { value: 'PM', label: intl.formatMessage({ id: 'time.pm' }) }
                ]}
                values={[amPm]}
                onGroupChange={(vals) => handleTimeChange('ampm', vals[0])}
                direction={isRTL ? 'rtl' : 'ltr'}
                groupDirection="row"
                groupGap={8}
            />
        </div>
    </div>
  );
}
