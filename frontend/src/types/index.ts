/**
 * Type definitions for MoveMaster
 */

export enum ApartmentSize {
  STUDIO = 'studio',
  ONE_BR = '1br',
  TWO_BR = '2br',
  THREE_BR = '3br',
  FOUR_BR_PLUS = '4br+'
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface Address {
  address: string
  postal_code: string
  city: string
  floor?: number
  has_elevator?: boolean
}

export interface InventoryItem {
  item_id: string
  name: string
  quantity: number
  volume_m3: number
  category?: string
}

export interface Service {
  service_type: 'packing' | 'disassembly' | 'hvz_permit' | 'kitchen_assembly' | 'external_lift'
  enabled: boolean
  cost?: number
  metadata?: Record<string, any>
}

export interface QuoteCalculateRequest {
  origin_postal_code: string
  destination_postal_code: string
  apartment_size?: ApartmentSize
  volume_m3?: number
  origin_floor?: number
  destination_floor?: number
  origin_has_elevator?: boolean
  destination_has_elevator?: boolean
  services?: Service[]
}

export interface QuoteCalculateResponse {
  min_price: number
  max_price: number
  distance_km: number
  estimated_hours: number
  volume_m3: number
  breakdown: {
    volume_cost: { min: number; max: number }
    distance_cost: { min: number; max: number }
    labor_cost: { min: number; max: number }
    floor_surcharge: number
    services_cost: { min: number; max: number }
  }
  suggestions?: {
    external_lift_origin?: boolean
    external_lift_destination?: boolean
  }
}

export interface QuoteSubmitRequest {
  company_slug?: string
  customer_email: string
  customer_phone?: string
  customer_name?: string
  origin: Address
  destination: Address
  inventory: InventoryItem[]
  services: Service[]
}

export interface Quote {
  id: string
  company_id: string
  customer_email: string
  customer_phone?: string
  customer_name?: string
  origin_address: Address
  destination_address: Address
  distance_km: number
  estimated_hours: number
  inventory: InventoryItem[]
  services: Service[]
  min_price: number
  max_price: number
  volume_m3: number
  status: QuoteStatus
  is_fixed_price: boolean
  pdf_url?: string
  created_at: string
}

export interface QuoteUpdateData {
  min_price?: number
  max_price?: number
  volume_m3?: number
  is_fixed_price?: boolean
}

export interface ItemTemplate {
  id: string
  name: string
  category: string
  volume_m3: number
  weight_kg?: number
  disassembly_minutes: number
  packing_minutes: number
}

export interface RoomTemplate {
  id: string
  name: string
  apartment_size: string
  default_items: Array<{
    category: string
    item_name: string
    quantity: number
  }>
}
