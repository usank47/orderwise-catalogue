import { Product } from '@/types/order';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          <Select value={product.category} onValueChange={(value) => onChange(index, 'category', value)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`brand-${index}`}>Brand</Label>
          <Select value={product.brand} onValueChange={(value) => onChange(index, 'brand', value)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
