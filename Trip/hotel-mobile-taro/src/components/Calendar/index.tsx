import React from 'react';
import { View, Text } from '@tarojs/components';
import dayjs, { Dayjs } from 'dayjs';
import './index.scss';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export interface CalendarProps {
  value?: Dayjs | null;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  onChange?: (date: Dayjs) => void;
  title?: string;
}

export default function Calendar(props: CalendarProps) {
  const {
    value,
    minDate = dayjs().startOf('day'),
    maxDate = dayjs().add(2, 'year').endOf('month'),
    onChange,
    title,
  } = props;

  const [currentMonth, setCurrentMonth] = React.useState<Dayjs>(
    value ? value.startOf('month') : dayjs().startOf('month')
  );

  const start = currentMonth.startOf('month').startOf('week');
  const end = currentMonth.endOf('month').endOf('week');
  const days: Dayjs[] = [];
  let d = start;
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    days.push(d);
    d = d.add(1, 'day');
  }

  const weeks: Dayjs[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const isDisabled = (date: Dayjs) => {
    return date.isBefore(minDate, 'day') || date.isAfter(maxDate, 'day');
  };

  const isSelected = (date: Dayjs) => value && date.isSame(value, 'day');
  const isToday = (date: Dayjs) => date.isSame(dayjs(), 'day');
  const isCurrentMonth = (date: Dayjs) => date.month() === currentMonth.month();

  const handlePrevMonth = () => {
    setCurrentMonth((m) => m.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth((m) => m.add(1, 'month'));
  };

  const handleSelect = (date: Dayjs) => {
    if (isDisabled(date)) return;
    onChange?.(date);
  };

  return (
    <View className="calendar">
      {title && <Text className="calendar-title">{title}</Text>}
      <View className="calendar-header">
        <Text className="calendar-nav" onClick={handlePrevMonth}>‹</Text>
        <Text className="calendar-month">{currentMonth.format('YYYY年MM月')}</Text>
        <Text className="calendar-nav" onClick={handleNextMonth}>›</Text>
      </View>
      <View className="calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <Text key={w} className="calendar-weekday">{w}</Text>
        ))}
      </View>
      <View className="calendar-body">
        {weeks.map((week, wi) => (
          <View key={wi} className="calendar-row">
            {week.map((date) => {
              const disabled = isDisabled(date);
              const selected = isSelected(date);
              const today = isToday(date);
              const otherMonth = !isCurrentMonth(date);
              return (
                <Text
                  key={date.valueOf()}
                  className={`calendar-day ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${today ? 'today' : ''} ${otherMonth ? 'other-month' : ''}`}
                  onClick={() => handleSelect(date)}
                >
                  {date.date()}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
