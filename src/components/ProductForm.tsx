import { Product } from '@/types/order';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import ComboBox from '@/components/ui/combobox';

interface ProductFormProps {
  product: Product;
  index: number;
  onChange: (index: number, field: keyof Product, value: string | number) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
  productNameOptions?: string[];
  categoryOptions?: string[];
  brandOptions?: string[];
  compatibilityOptions?: string[];
}

const ProductForm = ({
  product,
  index,
  onChange,
  onRemove,
  showRemove,
  productNameOptions = [],
  categoryOptions = [],
  brandOptions = [],
  compatibilityOptions = [],
}: ProductFormProps) => {
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
          <ComboBox
            id={`product-name-${index}`}
            value={product.name || ''}
            onChange={(val: string) => onChange(index, 'name', val)}
            options={productNameOptions}
            placeholder="Select or type product name"
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
            options={categoryOptions}
            placeholder="Select or type category"
          />
        </div>

        <div>
          <Label htmlFor={`brand-${index}`}>Brand</Label>
          <ComboBox
            id={`brand-${index}`}
            value={product.brand || ''}
            onChange={(val: string) => onChange(index, 'brand', val)}
            options={brandOptions}
            placeholder="Select or type brand"
          />
        </div>

        <div>
          <Label htmlFor={`compatibility-${index}`}>Compatibility (Optional)</Label>
          <ComboBox
            id={`compatibility-${index}`}
            value={product.compatibility || ''}
            onChange={(val: string) => onChange(index, 'compatibility', val)}
            options={compatibilityOptions}
            placeholder="Select or type compatibility"
          />
        </div>
      </div>
    </Card>
  );
};

export default ProductForm;
