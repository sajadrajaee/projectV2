export type UserRole = 'CUSTOMER' | 'OFFICE' | 'PENDING'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: UserRole
}

export interface PropertyFile {
  id: number
  file: string
}

export interface Property {
  id: number
  listing_type: 'RENT' | 'SALE' | 'GERAWI'
  property_type: 'ZAMIN' | 'KHANA' | 'DOKAN' | 'HAWILI'
  description: string | null
  price: number | null
  province: string | null
  district: string
  area: string | null
  status: 'AVAILABLE' | 'SOLD' | 'RENTED'
  created_at: string | null
  files: PropertyFile[]
  office?: Office | null
}

export interface Page<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Office {
  id: number
  profile: string | null
  name: string | null
  admin_name: string
  address: string | null
  introduction: string | null
  latitude: string | null
  longitude: string | null
}

export interface OfficeDirectoryRecord extends Office {
  admin_phone: string | null
  admin_whatsapp: string | null
}

export interface OfficeProfile extends Office {
  admin_phone: string | null
  admin_whatsapp: string | null
}

export interface PublicOfficeProfile extends Office {
  admin_phone: string | null
  admin_whatsapp: string | null
}

export interface Note {
  id: number
  title: string
  description: string
  create_at: string
  updated_at: string
}

export interface Deal {
  id: number
  sata_number: string
  deal_type: 'SALE' | 'RENT'
  owner_name: string
  owner_phone: string
  customer_name: string
  customer_phone: string
  total_price: string
  advance_payment: string
  currency: string
  office_commission: string
  deal_contract: string | null
  status: 'DEALED' | 'DEALING' | 'CANCELED'
  description: string | null
  created_at: string
  updated_at: string
}

export type Report = Record<string, number>

export const PROVINCES = [
  ['KABUL', 'کابل'],
  ['GHAZNI', 'غزنی'],
  ['HERAT', 'هرات'],
] as const

export const DISTRICTS = [
  ['4', 'ناحیه ۴'],
  ['18', 'ناحیه ۱۸'],
  ['6', 'ناحیه ۶'],
  ['13', 'ناحیه ۱۳'],
] as const

export const PROPERTY_TYPES = [
  ['KHANA', 'خانه'],
  ['DOKAN', 'دکان'],
  ['ZAMIN', 'زمین'],
  ['HAWILI', 'حویلی'],
] as const

export const LISTING_TYPES = [
  ['RENT', 'کرایی'],
  ['SALE', 'فروشی'],
  ['GERAWI', 'گروی'],
] as const

export function labelFor(value: string | null | undefined, choices: readonly (readonly [string, string])[]) {
  return choices.find(([key]) => key === value)?.[1] ?? value ?? 'ثبت نشده'
}

export interface LoginResponse {
  message: string
  access: string
  refresh: string
  user: User
}

export interface RegisterResponse {
  message: string
  user?: Pick<User, 'id' | 'email' | 'user_type'>
}

export interface CustomerProfile {
  id: number
  profile_pic: string | null
  first_name: string
  last_name: string
  phone: string | null
  gender: 'MALE' | 'FEMALE' | null
}