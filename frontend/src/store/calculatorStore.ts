/**
 * Zustand store for calculator state management
 */
import { create } from 'zustand'
import type {
  Address,
  InventoryItem,
  Service,
  QuoteCalculateResponse,
  ApartmentSize,
} from '@/types'
import { quoteAPI } from '@/services/api'

interface SmartProfile {
  apartment_size: string
  household_type: string
  furnishing_level: string
  has_home_office?: boolean | null
  has_kids?: boolean | null
  years_lived?: number
  special_items?: string[]
}

interface CalculatorState {
  // Current step (1-4 or 2.5 for manual inventory)
  step: number
  
  // Smart Profile Mode
  useSmartMode: boolean
  smartProfile: SmartProfile | null
  
  // Step 1: Basic info
  originPostalCode: string
  destinationPostalCode: string
  apartmentSize: ApartmentSize | null
  originFloor: number
  destinationFloor: number
  originHasElevator: boolean
  destinationHasElevator: boolean
  
  // Step 2: Inventory
  inventory: InventoryItem[]
  
  // Step 3: Services
  services: Service[]
  
  // Step 4: Contact
  customerEmail: string
  customerPhone: string
  customerName: string
  
  // Calculated quote
  quote: QuoteCalculateResponse | null
  isCalculating: boolean
  error: string | null
  
  // Actions
  setStep: (step: number) => void
  setUseSmartMode: (use: boolean) => void
  setSmartProfile: (profile: SmartProfile) => void
  setOriginPostalCode: (code: string) => void
  setDestinationPostalCode: (code: string) => void
  setApartmentSize: (size: ApartmentSize | string) => void
  setOriginFloor: (floor: number) => void
  setDestinationFloor: (floor: number) => void
  setOriginHasElevator: (has: boolean) => void
  setDestinationHasElevator: (has: boolean) => void
  addInventoryItem: (item: InventoryItem) => void
  removeInventoryItem: (itemId: string) => void
  updateInventoryItemQuantity: (itemId: string, quantity: number) => void
  setInventory: (items: InventoryItem[]) => void
  setInventoryFromPrediction: (typicalItems: Record<string, any[]>) => void
  toggleService: (serviceType: string, enabled: boolean, metadata?: Record<string, any>) => void
  setCustomerEmail: (email: string) => void
  setCustomerPhone: (phone: string) => void
  setCustomerName: (name: string) => void
  calculateQuote: () => Promise<void>
  reset: () => void
}

const initialState = {
  step: 1,
  useSmartMode: true, // Default to smart mode
  smartProfile: null,
  originPostalCode: '',
  destinationPostalCode: '',
  apartmentSize: null,
  originFloor: 0,
  destinationFloor: 0,
  originHasElevator: false,
  destinationHasElevator: false,
  inventory: [],
  services: [],
  customerEmail: '',
  customerPhone: '',
  customerName: '',
  quote: null,
  isCalculating: false,
  error: null,
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  ...initialState,
  
  setStep: (step) => set({ step }),
  
  setUseSmartMode: (use) => set({ useSmartMode: use }),
  
  setSmartProfile: (profile) => set({ smartProfile: profile }),
  
  setOriginPostalCode: (code) => set({ originPostalCode: code }),
  
  setDestinationPostalCode: (code) => set({ destinationPostalCode: code }),
  
  setApartmentSize: (size) => set({ apartmentSize: size }),
  
  setOriginFloor: (floor) => set({ originFloor: floor }),
  
  setDestinationFloor: (floor) => set({ destinationFloor: floor }),
  
  setOriginHasElevator: (has) => set({ originHasElevator: has }),
  
  setDestinationHasElevator: (has) => set({ destinationHasElevator: has }),
  
  addInventoryItem: (item) => {
    const { inventory } = get()
    const existing = inventory.find((i) => i.item_id === item.item_id)
    
    if (existing) {
      set({
        inventory: inventory.map((i) =>
          i.item_id === item.item_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
      })
    } else {
      set({ inventory: [...inventory, item] })
    }
  },
  
  removeInventoryItem: (itemId) => {
    const { inventory } = get()
    set({ inventory: inventory.filter((i) => i.item_id !== itemId) })
  },
  
  updateInventoryItemQuantity: (itemId, quantity) => {
    const { inventory } = get()
    if (quantity <= 0) {
      set({ inventory: inventory.filter((i) => i.item_id !== itemId) })
    } else {
      set({
        inventory: inventory.map((i) =>
          i.item_id === itemId ? { ...i, quantity } : i
        ),
      })
    }
  },
  
  setInventory: (items) => set({ inventory: items }),
  
  setInventoryFromPrediction: (typicalItems) => {
    // Convert prediction format to inventory items
    const inventory: InventoryItem[] = []
    
    Object.entries(typicalItems).forEach(([room, items]) => {
      (items as any[]).forEach((item) => {
        inventory.push({
          item_id: `${room}_${item.name}`,
          name: item.name,
          quantity: item.quantity || 1,
          volume_m3: Number(item.volume_m3),
          category: room,
        })
      })
    })
    
    set({ inventory })
  },
  
  toggleService: (serviceType, enabled, metadata = {}) => {
    const { services } = get()
    const existing = services.find((s) => s.service_type === serviceType)
    
    if (existing) {
      set({
        services: services.map((s) =>
          s.service_type === serviceType
            ? { ...s, enabled, metadata: { ...s.metadata, ...metadata } }
            : s
        ),
      })
    } else {
      set({
        services: [
          ...services,
          { service_type: serviceType as any, enabled, metadata },
        ],
      })
    }
  },
  
  setCustomerEmail: (email) => set({ customerEmail: email }),
  
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  
  setCustomerName: (name) => set({ customerName: name }),
  
  calculateQuote: async () => {
    const state = get()
    
    set({ isCalculating: true, error: null })
    
    try {
      const volumeM3 = state.inventory.reduce(
        (sum, item) => sum + item.volume_m3 * item.quantity,
        0
      )
      
      const quote = await quoteAPI.calculateQuote({
        origin_postal_code: state.originPostalCode,
        destination_postal_code: state.destinationPostalCode,
        apartment_size: state.apartmentSize || undefined,
        volume_m3: volumeM3 > 0 ? volumeM3 : undefined,
        origin_floor: state.originFloor,
        destination_floor: state.destinationFloor,
        origin_has_elevator: state.originHasElevator,
        destination_has_elevator: state.destinationHasElevator,
        services: state.services,
      })
      
      set({ quote, isCalculating: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to calculate quote',
        isCalculating: false,
      })
    }
  },
  
  reset: () => set(initialState),
}))
