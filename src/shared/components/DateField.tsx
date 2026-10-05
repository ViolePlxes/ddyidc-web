import { Button, DatePicker, Input, Popover } from '@cloudflare/kumo';
import { CalendarDotsIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';

interface DateFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  withTime?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  seconds?: boolean;
}

/** Kumo calendar; values are local calendar dates, never UTC date slices. */
export function DateField({ label, value, onValueChange, withTime = false, disabled = false, clearable = true, seconds = false }: DateFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(`${value.slice(0, 10)}T${withTime ? value.slice(11) || '00:00' : '12:00'}`) : undefined;
  const selected = parsed && Number.isFinite(parsed.getTime()) ? parsed : undefined;
  const time = value.slice(11) || (seconds ? '00:00:00' : '00:00');
  const selectDate = (date: Date | undefined) => {
    if (!date) return;
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onValueChange(withTime ? `${day}T${time}` : day);
    setOpen(false);
  };
  return <div className="grid gap-2">
    <span id={id} className="text-sm font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger render={<Button type="button" variant="secondary" icon={CalendarDotsIcon} disabled={disabled} aria-label={label} aria-describedby={id} />}>
          {selected ? selected.toLocaleDateString('zh-CN') : '选择日期'}
        </Popover.Trigger>
        <Popover.Content className="p-3">
          <DatePicker mode="single" selected={selected} defaultMonth={selected} onChange={selectDate} disabled={disabled}
            labels={{ labelNav: () => '切换月份', labelGrid: date => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }), labelPrevious: () => '上个月', labelNext: () => '下个月', labelDayButton: date => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            formatters={{ formatCaption: date => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }), formatWeekdayName: date => date.toLocaleDateString('zh-CN', { weekday: 'short' }) }} />
        </Popover.Content>
      </Popover>
      {clearable && value && <Button type="button" size="sm" variant="ghost" disabled={disabled} aria-label={`清除${label}`} onClick={() => onValueChange('')}>清除</Button>}
    </div>
    {withTime && <Input label={`${label}时刻`} type="time" step={seconds ? 1 : 60} value={selected ? time : ''} disabled={disabled || !selected} onChange={event => { if (event.target.value) onValueChange(`${value.slice(0, 10)}T${event.target.value}`); }} />}
  </div>;
}
