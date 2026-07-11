export type Role = 'customer' | 'seller' | 'delivery' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  avatar_url: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url: string;
  sort_order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  country: string;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand_id: string;
  category_id: string;
  price: number;
  mrp: number;
  images: string[];
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  stock: number;
  rating: number;
  review_count: number;
  emi_available: boolean;
  emi_from: number;
  is_featured: boolean;
  is_new: boolean;
  colors: string[];
  created_at: string;
}

export interface ProductWithRefs extends Product {
  brands?: Pick<Brand, 'name' | 'slug'> | null;
  categories?: Pick<Category, 'name' | 'slug'> | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: ProductWithRefs;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: ProductWithRefs;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  items_total: number;
  delivery_charge: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  address: AddressSnapshot;
  delivery_otp: string;
  delivery_partner_name: string;
  tracking_lat: number | null;
  tracking_lng: number | null;
  eta_minutes: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
}

export interface AddressSnapshot {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_percent: number;
  min_order: number;
  max_discount: number;
  is_active: boolean;
  valid_until: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
