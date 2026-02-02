/**
 * Step 4: Smart Inventory
 * Improved UI with Search, Room Categories, and Custom Items
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, ArrowRight, ArrowLeft, Package, Sofa,
  Bed, UtensilsCrossed, Search, Trash2, Truck,
  PlusCircle, Tv
} from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'
import { quoteAPI } from '@/services/api'
import type { ItemTemplate } from '@/types'
import clsx from 'clsx'

export default function StepInventory() {
  const {
    inventory,
    setStep,
    addInventoryItem,
    updateInventoryItemQuantity,
    removeInventoryItem,
    calculateQuote,
  } = useCalculatorStore()

  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('living_room')
  const [searchQuery, setSearchQuery] = useState('')

  // Custom item states
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customVolume, setCustomVolume] = useState('1.0')

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
    { id: 'office', label: 'Büro', icon: Tv },
    { id: 'other', label: 'Sonstiges', icon: Package },
  ]

  const filteredTemplates = useMemo(() => {
    let filtered = itemTemplates

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      )
    } else {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    return filtered
  }, [itemTemplates, selectedCategory, searchQuery])

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

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName || !customVolume) return

    addInventoryItem({
      item_id: `custom_${Date.now()}`,
      name: customName,
      quantity: 1,
      volume_m3: parseFloat(customVolume),
      category: 'custom'
    })

    setCustomName('')
    setCustomVolume('1.0')
    setShowCustomForm(false)
  }

  const handleNext = async () => {
    await calculateQuote()
    setStep(5) // Move to Services
  }

  const totalVolume = inventory.reduce(
    (sum, item) => sum + item.volume_m3 * item.quantity,
    0
  )

  // Truck capacity visualization (e.g. 3.5t truck ~ 20m3, 7.5t ~ 35m3)
  const truckCapacity = totalVolume <= 18 ? 20 : (totalVolume <= 32 ? 35 : 50)
  const truckProgress = Math.min((totalVolume / truckCapacity) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto px-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Item Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Was ziehen wir um?
              </h2>
              <p className="text-gray-600">
                Wählen Sie Ihre Möbel aus oder suchen Sie direkt danach.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="input-field pl-10 h-12 text-lg"
                placeholder="Suchen (z.B. Couch, Schrank, Kartons...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap border-2',
                      {
                        'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200':
                          selectedCategory === category.id,
                        'bg-white border-gray-100 text-gray-600 hover:border-primary-200 hover:bg-primary-50':
                          selectedCategory !== category.id,
                      }
                    )}
                  >
                    <category.icon className="w-5 h-5" />
                    {category.label}
                  </button>
                ))}
              </div>
            )}

            {/* Item Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"
                />
                <p className="mt-4 text-gray-500 font-medium">Lade Vorlagen...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template) => {
                    const quantity = getItemQuantity(template.id)
                    return (
                      <motion.div
                        layout
                        key={template.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={clsx(
                          'p-4 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col justify-between h-32',
                          {
                            'border-primary-600 bg-primary-50': quantity > 0,
                            'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md': quantity === 0,
                          }
                        )}
                        onClick={() => quantity === 0 && handleAddItem(template)}
                      >
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {Number(template.volume_m3).toFixed(1)} m³
                          </p>
                        </div>

                        <div className="flex justify-end mt-2">
                          {quantity === 0 ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600">
                              <Plus className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-full border border-primary-200 shadow-sm" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleUpdateQuantity(template.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-primary-600 hover:bg-primary-50 rounded-full"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-primary-900 min-w-[20px] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(template.id, 1)}
                                className="w-7 h-7 flex items-center justify-center bg-primary-600 text-white rounded-full hover:bg-primary-700"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Custom Item Button */}
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 group h-32"
                >
                  <PlusCircle className="w-8 h-8 text-gray-400 group-hover:text-primary-600" />
                  <span className="text-sm font-semibold text-gray-500 group-hover:text-primary-700">Eigener Gegenstand</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary & Preview */}
        <div className="space-y-6">
          <div className="card sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-600" />
              Ihr Umzugsvolumen
            </h3>

            {/* Truck Visualizer */}
            <div className="bg-gray-100 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-primary-600">
                  {totalVolume.toFixed(1)} <span className="text-lg font-bold">m³</span>
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  LKW Kapazität
                </span>
              </div>

              <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200 mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${truckProgress}%` }}
                  className={clsx("h-full transition-colors duration-500", {
                    'bg-green-500': truckProgress < 80,
                    'bg-orange-500': truckProgress >= 80 && truckProgress < 95,
                    'bg-red-500': truckProgress >= 95,
                  })}
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                {totalVolume <= 18 ? 'Empfehlung: 3.5t Transporter' : (totalVolume <= 32 ? 'Empfehlung: 7.5t LKW' : 'Empfehlung: 12t LKW')}
              </p>
            </div>

            {/* Selection List (Minified) */}
            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {inventory.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Noch keine Artikel ausgewählt</p>
                </div>
              ) : (
                inventory.map((item) => (
                  <div key={item.item_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-gray-500">{item.quantity} x {Number(item.volume_m3).toFixed(1)} m³</p>
                    </div>
                    <button
                      onClick={() => removeInventoryItem(item.item_id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 ml-2">{(item.quantity * Number(item.volume_m3)).toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={handleNext}
                disabled={inventory.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg shadow-xl shadow-primary-200"
              >
                Konfiguration übernehmen
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setStep(3)}
                className="text-gray-500 hover:text-gray-800 text-sm font-medium w-full text-center py-2 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Schätzung
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Item Modal */}
      <AnimatePresence>
        {showCustomForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Neuer Gegenstand</h3>
              <form onSubmit={handleAddCustomItem} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name des Gegenstands</label>
                  <input
                    autoFocus
                    type="text"
                    className="input-field"
                    placeholder="z.B. Weinkühlschrank, Sofa-Hocker..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Geschätztes Volumen (m³)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      className="flex-1 accent-primary-600"
                      value={customVolume}
                      onChange={(e) => setCustomVolume(e.target.value)}
                    />
                    <span className="w-20 text-center font-black bg-primary-100 text-primary-700 py-2 rounded-xl border border-primary-200">
                      {customVolume} m³
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                    <span>Klein (0.1)</span>
                    <span>Groß (10.0)</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Hinzufügen
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
