/**
 * Frontend models. They mirror Shop.Domain (Product, Category, Brand, ProductVariant,
 * Review, ShippingMethod, Coupon, Order ...) so the HTTP layer can map 1:1 later.
 */
export type Glyph = 'laptop' | 'phone' | 'headphones' | 'watch' | 'shirt' | 'shoe' | 'sofa' | 'dumbbell';

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  glyph: Glyph;
  hue: number;
}

export interface Brand {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  color?: string;
  colorAr?: string;
  colorHex?: string;
  size?: string;
  priceOverride?: number;
  stock: number;
}

export interface ProductSpec {
  name: string;
  nameAr: string;
  value: string;
}

export interface Product {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  basePrice: number;
  compareAtPrice?: number;
  isFeatured: boolean;
  totalSold: number;
  averageRating: number;
  reviewCount: number;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  categoryNameAr: string;
  brandId: number;
  brandSlug: string;
  brandName: string;
  brandNameAr: string;
  createdAt: string;
  hue: number;
  glyph: Glyph;
  variants: ProductVariant[];
  specifications: ProductSpec[];
  highlights: string[];
  highlightsAr: string[];
}

export interface Review {
  id: number;
  productId: number;
  author: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popular';

export interface ProductQuery {
  q?: string;
  category?: string;
  brands?: string[];
  min?: number;
  max?: number;
  rating?: number;
  sale?: boolean;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface Facets {
  categories: Record<string, number>;
  brands: Record<string, number>;
  priceMin: number;
  priceMax: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  facets: Facets;
}

export interface Suggestions {
  products: Product[];
  categories: Category[];
}

export interface CartLine {
  key: string;
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  compareAt?: number;
  qty: number;
  maxQty: number;
  color?: string;
  colorAr?: string;
  colorHex?: string;
  size?: string;
  hue: number;
  glyph: Glyph;
}

export type CouponType = 'Percentage' | 'FixedAmount' | 'FreeShipping';

export interface AppliedCoupon {
  code: string;
  type: CouponType;
  value: number;
  description: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  cost: number;
  freeAbove?: number;
  minDays: number;
  maxDays: number;
}

/** Same members as Shop.Domain.Enums.OrderStatus. */
export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'ReturnRequested'
  | 'Returned'
  | 'Refunded';

/** Same members as Shop.Domain.Enums.PaymentProvider. */
export type PaymentProvider = 'CashOnDelivery' | 'Stripe' | 'PayPal';

export interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  productId: number;
  slug: string;
  name: string;
  nameAr: string;
  variantLabel: string;
  price: number;
  qty: number;
  hue: number;
  glyph: Glyph;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  email: string;
  address: OrderAddress;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingMethod: string;
  shippingMethodAr: string;
  payment: PaymentProvider;
  couponCode?: string;
}

export interface PlaceOrderRequest {
  email: string;
  address: OrderAddress;
  shippingMethodId: number;
  payment: PaymentProvider;
  couponCode?: string;
  lines: { productId: number; variantId: number; qty: number }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}
