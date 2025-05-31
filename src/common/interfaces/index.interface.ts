import {
  Address,
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

  addresses?: Address[];
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

export interface AddressParse {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

// interfaces/cart.types.ts
export interface CouponCart {
  value: number;
  code: string;
}

export interface ProductItemCart {
  id: string;
  name: string;
  description: string;
  price: number;
  isService: boolean;
  isActive: boolean;
  hasDelivery: boolean;
  categoryId: string;
  brandId: string;
  finalPrice?: number;
  couponPercentage?: number;
  variant: VariantItemCart;
}

export interface VariantItemCart {
  id: string;
  size: string;
  color: string;
  stock: number;
  productId: string;
}

export interface RawCartItem {
  id: string;
  quantity: number;
  product: ProductItemCart;
  variant?: VariantItemCart;
}

export interface RawCart {
  id: string;
  coupon?: CouponCart | null;
  items: RawCartItem[];
}

export interface ParsedCartItem {
  id: string;
  quantity: number;
  product: ProductItemCart;
}

export interface ParsedCart {
  id: string;
  coupon?: CouponCart | null;
  items: ParsedCartItem[];
}
