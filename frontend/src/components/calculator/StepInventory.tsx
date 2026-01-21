/**
 * Step 2: Smart Inventory
 * Pre-filled room templates with visual item selection
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, ArrowRight, ArrowLeft, Package, Sofa, Bed, UtensilsCrossed } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'
import { quoteAPI } from '@/services/api'
import type { ItemTemplate } from '@/types'

export default function StepInventory() {
  const {
    inventory,
    apartmentSize,
    addInventoryItem,
    updateInventoryItemQuantity,
    setStep,
    calculateQuote,
  } = useCalculatorStore()
  
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('living_room')
  
  useEffect(() => {
    loadItemTemplates()
  }, [])
  
  const loadItemTemplates = async () => {
    try {
      const templates = await quoteAPI.getItemTemplates()
      setItemTemplates(templates)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load templates:', error)
      setLoading(false)
    }
  }
  
  const categories = [
    { id: 'living_room', label: 'Wohnzimmer', icon: Sofa },
    { id: 'bedroom', label: 'Schlafzimmer', icon: Bed },
    { id: 'kitchen', label: 'Küche', icon: UtensilsCrossed },
    { id: 'other', label: 'Sonstiges', icon: Package },
  ]
  
  const getItemQuantity = (itemId: string) => {
    const item = inventory.find((i) => i.item_id === itemId)
    return item?.quantity || 0
  }
  
  const handleAddItem = (template: ItemTemplate) => {
    addInventoryItem({
      item_id: template.id,
      name: template.name,
      quantity: 1,
      volume_m3: Number(template.volume_m3),
      category: template.category,
    })
  }
  
  const handleUpdateQuantity = (itemId: string, change: number) => {
    const currentQty = getItemQuantity(itemId)
    updateInventoryItemQuantity(itemId, Math.max(0, currentQty + change))
  }
  
  const handleNext = async () => {
    await calculateQuote()
    setStep(3)
  }
  
  const totalVolume = inventory.reduce(
    (sum, item) => sum + item.volume_m3 * item.quantity,
    0
  )
  
  const categoryTemplates = itemTemplates.filter(
    (t) => t.category === selectedCategory
  )
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-5xl mx-auto"
    >
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Was möchten Sie mitnehmen?
          </h2>
          <p className="text-gray-600">
            Wählen Sie Ihre Möbel und Gegenstände aus. Unsere vorausgewählten
            Vorlagen für {apartmentSize || '2-Zimmer'} Wohnung sind bereits
            ausgefüllt.
          </p>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
                {
                  'bg-primary-600 text-white shadow-md':
                    selectedCategory === category.id,
                  'bg-gray-100 text-gray-700 hover:bg-gray-200':
                    selectedCategory !== category.id,
                }
              )}
            >
              <category.icon className="w-5 h-5" />
              {category.label}
            </button>
          ))}
        </div>
        
        {/* Item Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <AnimatePresence mode="wait">
              {categoryTemplates.map((template) => {
                const quantity = getItemQuantity(template.id)
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={clsx(
                      'border-2 rounded-lg p-4 transition-all',
                      {
                        'border-primary-600 bg-primary-50': quantity > 0,
                        'border-gray-200 hover:border-gray-300': quantity === 0,
                      }
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {template.volume_m3} m³
                        </p>
                      </div>
                    </div>
                    
                    {quantity === 0 ? (
                      <button
                        onClick={() => handleAddItem(template)}
                        className="w-full btn-secondary py-2 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Hinzufügen
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(template.id, -1)}
                          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center font-semibold text-lg">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(template.id, 1)}
                          className="w-10 h-10 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
        
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">
                {inventory.length} Artikel • {totalVolume.toFixed(1)} m³
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setStep(1)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={inventory.length === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Weiter zu Services
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

import clsx from 'clsx'
