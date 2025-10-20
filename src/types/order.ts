export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  brand: string;
  compatibility?: string;
}

export interface Order {
  id: string;
  date: string;
  supplier: string;
  products: Product[];
  totalAmount: number;
  createdAt: string;
}

export type SortField = 'category' | 'brand' | 'supplier';
