import * as React from 'react';
import { Input } from '@/components/ui/input';

type ComboProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
};

export const ComboBox: React.FC<ComboProps> = ({ id, value, onChange, options, placeholder, className }) => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState(value || '');
  const [highlight, setHighlight] = React.useState(-1);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => setInput(value || ''), [value]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(input.toLowerCase()));

  const selectAt = (idx: number) => {
    const v = filtered[idx];
    if (v) {
      onChange(v);
      setInput(v);
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div className={"relative " + (className || '')} ref={ref}>
      <Input
        id={id}
        value={input}
        onChange={(e) => {
          const val = e.target.value;
          setInput(val);
          setOpen(true);
          // propagate value live so parent sees typed entries and validation enables
          onChange(val);
        }}
        onBlur={() => {
          // ensure last typed value is propagated
          onChange(input);
          setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            if (highlight >= 0) {
              e.preventDefault();
              selectAt(highlight);
            } else {
              onChange(input);
              setOpen(false);
            }
          } else if (e.key === 'Escape') {
            setOpen(false);
            setHighlight(-1);
          }
        }}
        placeholder={placeholder}
        className="mt-1.5"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.map((opt, idx) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(ev) => {
                ev.preventDefault();
                selectAt(idx);
              }}
              onMouseEnter={() => setHighlight(idx)}
              className={`w-full text-left px-3 py-2 ${idx === highlight ? 'bg-muted/50' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComboBox;
