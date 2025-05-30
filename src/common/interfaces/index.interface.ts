import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Role,
} from '@prisma/client';

export interface BasicUserInfo {
  id: string;
  email: string;
  role: Role;
  name?: string;
  phone?: string;
  cuitOrDni?: string;
}

export interface ParsedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  isService: boolean;
  isActive: boolean;
  hasDelivery: boolean;
  category: {
    id: string;
    name: string;
    subcategories: {
      id: string;
      name: string;
    }[];
  } | null;
  brand: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  variants: {
    id: string;
    size: string;
    color: string;
    stock: number;
  }[];
  images: {
    id: string;
    url: string;
    order: number;
  }[];
}

export interface CategoryRaw {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  children?: CategoryRaw[];
}

export interface CategoryParsed {
  id: string;
  name: string;
  description: string;
  subcategories: CategoryParsed[];
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: object;
}

export interface OrderItemWithDetails extends OrderItem {
  product: Pick<Product, 'name'>;
  variant: Pick<ProductVariant, 'size' | 'color'>;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithDetails[];
}
