import { Product } from '@/types/order';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ProductFormProps {
  product: Product;
  index: number;
  onChange: (index: number, field: keyof Product, value: string | number) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

const categories = ['Electronics', 'Accessories', 'Software', 'Hardware', 'Peripherals'];
const brands = ['Logitech', 'Microsoft', 'Apple', 'Dell', 'HP', 'Lenovo', 'Samsung'];

type ComboProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
};

const ComboBox: React.FC<ComboProps> = ({ id, value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || '');
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => setInput(value || ''), [value]);

  useEffect(() => {
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
    <div className="relative" ref={ref}>
      <Input
        id={id}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
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
                // use onMouseDown to prevent blur before click
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

const ProductForm = ({ product, index, onChange, onRemove, showRemove }: ProductFormProps) => {
  return (
    <Card className="p-6 space-y-4 hover:shadow-medium transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Product {index + 1}</h3>
        {showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor={`product-name-${index}`}>Product Name</Label>
          <Input
            id={`product-name-${index}`}
            value={product.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="e.g., Wireless Mouse"
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
            <Input
              id={`quantity-${index}`}
              type="number"
              min="1"
              value={product.quantity}
              onChange={(e) => onChange(index, 'quantity', parseInt(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor={`price-${index}`}>Price (₹)</Label>
            <Input
              id={`price-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={product.price}
              onChange={(e) => onChange(index, 'price', parseFloat(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`category-${index}`}>Category</Label>
          <ComboBox
            id={`category-${index}`}
            value={product.category || ''}
            onChange={(val: string) => onChange(index, 'category', val)}
            options={categories}
            placeholder="Select or type category"
          />
        </div>

        <div>
          <Label htmlFor={`brand-${index}`}>Brand</Label>
          <ComboBox
            id={`brand-${index}`}
            value={product.brand || ''}
            onChange={(val: string) => onChange(index, 'brand', val)}
            options={brands}
            placeholder="Select or type brand"
          />
        </div>

        <div>
          <Label htmlFor={`compatibility-${index}`}>Compatibility (Optional)</Label>
          <Input
            id={`compatibility-${index}`}
            value={product.compatibility || ''}
            onChange={(e) => onChange(index, 'compatibility', e.target.value)}
            placeholder="e.g., Windows, macOS"
            className="mt-1.5"
          />
        </div>
      </div>
    </Card>
  );
};

export default ProductForm;
