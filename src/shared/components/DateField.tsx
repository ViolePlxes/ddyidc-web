import { Button, DatePicker, Input, Popover, type DateRange } from '@cloudflare/kumo';
import { CalendarDotsIcon } from '@phosphor-icons/react';
import { useEffect, useId, useState } from 'react';

interface DateFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  withTime?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  seconds?: boolean;
}

interface DateRangeFieldProps {
  label: string;
  from: string;
  to: string;
  onValueChange: (from: string, to: string) => void;
  withTime?: boolean;
  seconds?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  allowPartial?: boolean;
}

const calendarDate = (value: string) => {
  const date = value ? new Date(`${value.slice(0, 10)}T12:00:00`) : undefined;
  return date && Number.isFinite(date.getTime()) ? date : undefined;
};
const calendarValue = (date: Date | undefined) => date
  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

/** One Kumo range calendar; publish both endpoints together, preserving local times. */
export function DateRangeField({ label, from, to, onValueChange, withTime = false, seconds = false, disabled = false, clearable = true, allowPartial = true }: DateRangeFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>();
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const changeOpen = (next: boolean) => {
    if (next) {
      setRange(from || to ? { from: calendarDate(from), to: calendarDate(to) } : undefined);
      setFromTime(from.slice(11) || (seconds ? '00:00:00' : '00:00'));
      setToTime(to.slice(11) || (seconds ? '00:00:00' : '00:00'));
    }
    setOpen(next);
  };
  const valueFor = (date: Date | undefined, time: string) => date ? `${calendarValue(date)}${withTime ? `T${time}` : ''}` : '';
  const nextFrom = valueFor(range?.from, fromTime);
  const nextTo = valueFor(range?.to, toTime);
  const invalid = Boolean(nextFrom && nextTo && nextFrom > nextTo);
  const incomplete = !allowPartial && (!nextFrom || !nextTo);
  const format = (value: string) => value ? `${calendarDate(value)?.toLocaleDateString('zh-CN') ?? ''}${withTime ? ` ${value.slice(11)}` : ''}` : '不限';
  return <div className="grid min-w-0 gap-2">
    <span id={id} className="text-sm font-medium">{label}</span>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={changeOpen}>
        <Popover.Trigger render={<Button type="button" variant="secondary" icon={CalendarDotsIcon} disabled={disabled} aria-label={label} aria-describedby={id} className="h-auto min-h-9 max-w-full whitespace-normal" />}>
          {from || to ? `${format(from)} – ${format(to)}` : '选择日期范围'}
        </Popover.Trigger>
        <Popover.Content className="max-h-[var(--available-height)] max-w-[calc(100vw-2rem)] overflow-auto p-3">
          <div className="grid gap-3">
            <DatePicker mode="range" selected={range} defaultMonth={range?.from ?? range?.to} onChange={setRange} numberOfMonths={wide ? 2 : 1} disabled={disabled}
              labels={{ labelNav: () => '切换月份', labelGrid: date => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }), labelPrevious: () => '上个月', labelNext: () => '下个月', labelDayButton: date => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}
              formatters={{ formatCaption: date => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }), formatWeekdayName: date => date.toLocaleDateString('zh-CN', { weekday: 'short' }) }} />
            <p className="text-sm text-kumo-subtle">{range?.from ? `${calendarValue(range.from)} – ${calendarValue(range.to) || '请选择结束日期'}` : '请选择开始日期和结束日期'}</p>
            {allowPartial && <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={disabled || !range?.from} onClick={() => setRange(current => ({ from: undefined, to: current?.to }))}>不限开始日期</Button>
              <Button type="button" variant="ghost" size="sm" disabled={disabled || !range?.to} onClick={() => setRange(current => ({ from: current?.from, to: undefined }))}>不限结束日期</Button>
            </div>}
            {withTime && <div className="grid gap-3 sm:grid-cols-2">
              <Input label="开始时刻" type="time" step={seconds ? 1 : 60} value={fromTime} disabled={disabled || !range?.from} onChange={event => { if (event.target.value) setFromTime(event.target.value); }} />
              <Input label="结束时刻" type="time" step={seconds ? 1 : 60} value={toTime} disabled={disabled || !range?.to} onChange={event => { if (event.target.value) setToTime(event.target.value); }} />
            </div>}
            {invalid && <p role="alert" className="text-sm text-kumo-danger">结束时间不能早于开始时间</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" disabled={disabled} onClick={() => setRange(undefined)}>重新选择</Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>取消</Button>
              <Button type="button" disabled={disabled || invalid || incomplete || (!nextFrom && !nextTo)} onClick={() => { onValueChange(nextFrom, nextTo); setOpen(false); }}>应用范围</Button>
            </div>
          </div>
        </Popover.Content>
      </Popover>
      {clearable && (from || to) && <Button type="button" size="sm" variant="ghost" disabled={disabled} aria-label={`清除${label}`} onClick={() => onValueChange('', '')}>清除</Button>}
    </div>
  </div>;
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
