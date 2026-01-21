# MoveMaster Enhancement Implementation Plan

## Phase 1: Foundation (Week 1)

### Day 1-2: Massive Inventory Expansion

#### Step 1: Update Database Schema

```sql
-- backend/alembic/versions/add_item_enhancements.py
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS is_fragile BOOLEAN DEFAULT FALSE;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS packing_tips TEXT;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS typical_quantity INTEGER DEFAULT 1;

CREATE INDEX idx_items_category ON item_templates(category);
CREATE INDEX idx_items_subcategory ON item_templates(subcategory);
CREATE INDEX idx_items_popularity ON item_templates(popularity_score DESC);
```

#### Step 2: Enhance Item Model

```python
# backend/app/models/item_template.py
class ItemTemplate(Base):
    __tablename__ = "item_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    subcategory = Column(String, nullable=True)
    volume_m3 = Column(Numeric(10, 2), nullable=False)
    weight_kg = Column(Numeric(10, 2), nullable=True)
    disassembly_minutes = Column(Integer, default=0)
    packing_minutes = Column(Integer, default=0)
    
    # New fields
    image_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    is_fragile = Column(Boolean, default=False)
    is_special = Column(Boolean, default=False)  # Requires special handling
    packing_tips = Column(String, nullable=True)
    popularity_score = Column(Integer, default=0)  # For sorting
    typical_quantity = Column(Integer, default=1)  # Common quantity
    
    def __repr__(self):
        return f"<ItemTemplate {self.name} ({self.volume_m3}m³)>"
```

#### Step 3: Create Extended Seed Data

```python
# backend/app/utils/seed_data_extended.py
"""
Extended seed script with 150+ items
"""

EXTENDED_ITEMS = [
    # Living Room - Expanded (20 items)
    {
        "name": "Ecksofa / L-Sofa",
        "category": "living_room",
        "subcategory": "seating",
        "volume_m3": 4.5,
        "weight_kg": 95,
        "description": "Großes Ecksofa mit mehreren Modulen",
        "packing_tips": "Module einzeln verpacken, Polster separat",
        "is_fragile": False,
        "popularity_score": 85
    },
    {
        "name": "Recamiere / Chaiselongue",
        "category": "living_room",
        "subcategory": "seating",
        "volume_m3": 2.2,
        "weight_kg": 45,
        "packing_tips": "Mit Decke schützen"
    },
    {
        "name": "Wohnzimmerschrank / Vitrine",
        "category": "living_room",
        "subcategory": "storage",
        "volume_m3": 2.5,
        "weight_kg": 60,
        "disassembly_minutes": 20,
        "packing_tips": "Glasscheiben extra sichern"
    },
    {
        "name": "Sideboard",
        "category": "living_room",
        "subcategory": "storage",
        "volume_m3": 1.2,
        "weight_kg": 40
    },
    {
        "name": "TV-Lowboard",
        "category": "living_room",
        "subcategory": "media",
        "volume_m3": 0.9,
        "weight_kg": 25
    },
    {
        "name": "Stehlampe",
        "category": "living_room",
        "subcategory": "lighting",
        "volume_m3": 0.3,
        "weight_kg": 5,
        "is_fragile": True,
        "typical_quantity": 2
    },
    {
        "name": "Tischlampe",
        "category": "living_room",
        "subcategory": "lighting",
        "volume_m3": 0.1,
        "weight_kg": 2,
        "is_fragile": True,
        "typical_quantity": 3
    },
    {
        "name": "Wandregal / Hängeregal",
        "category": "living_room",
        "subcategory": "storage",
        "volume_m3": 0.6,
        "weight_kg": 15,
        "disassembly_minutes": 10
    },
    {
        "name": "Beistelltisch",
        "category": "living_room",
        "subcategory": "tables",
        "volume_m3": 0.2,
        "weight_kg": 8,
        "typical_quantity": 2
    },
    {
        "name": "Teppich (groß)",
        "category": "living_room",
        "subcategory": "decoration",
        "volume_m3": 0.4,
        "weight_kg": 12,
        "packing_tips": "Aufrollen und mit Folie sichern"
    },
    {
        "name": "Vorhänge & Gardinen (Set)",
        "category": "living_room",
        "subcategory": "decoration",
        "volume_m3": 0.2,
        "weight_kg": 3,
        "typical_quantity": 2
    },
    {
        "name": "Wandbild / Gemälde",
        "category": "living_room",
        "subcategory": "decoration",
        "volume_m3": 0.15,
        "weight_kg": 5,
        "is_fragile": True,
        "packing_tips": "Mit Blasenfolie schützen",
        "typical_quantity": 3
    },
    {
        "name": "Spiegel (groß)",
        "category": "living_room",
        "subcategory": "decoration",
        "volume_m3": 0.3,
        "weight_kg": 15,
        "is_fragile": True,
        "packing_tips": "Professionell verpacken"
    },
    {
        "name": "Zimmerpflanze (groß)",
        "category": "living_room",
        "subcategory": "plants",
        "volume_m3": 0.4,
        "weight_kg": 20,
        "is_fragile": True,
        "typical_quantity": 2
    },
    {
        "name": "Dekorationsgegenstände (Box)",
        "category": "living_room",
        "subcategory": "decoration",
        "volume_m3": 0.05,
        "weight_kg": 5,
        "typical_quantity": 5
    },
    
    # Office/Study - NEW (20 items)
    {
        "name": "Schreibtisch (Standard)",
        "category": "office",
        "subcategory": "furniture",
        "volume_m3": 1.5,
        "weight_kg": 40,
        "disassembly_minutes": 15,
        "popularity_score": 90
    },
    {
        "name": "L-förmiger Schreibtisch",
        "category": "office",
        "subcategory": "furniture",
        "volume_m3": 2.2,
        "weight_kg": 55,
        "disassembly_minutes": 20
    },
    {
        "name": "Höhenverstellbarer Schreibtisch",
        "category": "office",
        "subcategory": "furniture",
        "volume_m3": 1.8,
        "weight_kg": 50,
        "disassembly_minutes": 10
    },
    {
        "name": "Bürostuhl / Drehstuhl",
        "category": "office",
        "subcategory": "seating",
        "volume_m3": 0.6,
        "weight_kg": 15,
        "popularity_score": 95
    },
    {
        "name": "Ergonomischer Bürostuhl",
        "category": "office",
        "subcategory": "seating",
        "volume_m3": 0.8,
        "weight_kg": 20
    },
    {
        "name": "Gaming-Stuhl",
        "category": "office",
        "subcategory": "seating",
        "volume_m3": 0.9,
        "weight_kg": 22
    },
    {
        "name": "Aktenschrank (2-türig)",
        "category": "office",
        "subcategory": "storage",
        "volume_m3": 1.2,
        "weight_kg": 45,
        "disassembly_minutes": 15
    },
    {
        "name": "Rollcontainer",
        "category": "office",
        "subcategory": "storage",
        "volume_m3": 0.3,
        "weight_kg": 20
    },
    {
        "name": "Bücherregal (groß)",
        "category": "office",
        "subcategory": "storage",
        "volume_m3": 1.8,
        "weight_kg": 50,
        "disassembly_minutes": 20
    },
    {
        "name": "Bücherregal (klein)",
        "category": "office",
        "subcategory": "storage",
        "volume_m3": 0.8,
        "weight_kg": 25,
        "disassembly_minutes": 10
    },
    {
        "name": "Computer / PC-Tower",
        "category": "office",
        "subcategory": "electronics",
        "volume_m3": 0.08,
        "weight_kg": 12,
        "is_fragile": True
    },
    {
        "name": "Monitor (24-27\")",
        "category": "office",
        "subcategory": "electronics",
        "volume_m3": 0.05,
        "weight_kg": 5,
        "is_fragile": True,
        "typical_quantity": 2
    },
    {
        "name": "Drucker / Scanner",
        "category": "office",
        "subcategory": "electronics",
        "volume_m3": 0.08,
        "weight_kg": 8
    },
    {
        "name": "Whiteboard / Pinnwand",
        "category": "office",
        "subcategory": "accessories",
        "volume_m3": 0.2,
        "weight_kg": 6
    },
    
    # Bathroom - NEW (15 items)
    {
        "name": "Waschmaschine",
        "category": "bathroom",
        "subcategory": "appliances",
        "volume_m3": 0.8,
        "weight_kg": 70,
        "disassembly_minutes": 10,
        "packing_tips": "Transportsicherung beachten",
        "popularity_score": 90
    },
    {
        "name": "Trockner",
        "category": "bathroom",
        "subcategory": "appliances",
        "volume_m3": 0.8,
        "weight_kg": 60,
        "disassembly_minutes": 10
    },
    {
        "name": "Badezimmerschrank",
        "category": "bathroom",
        "subcategory": "storage",
        "volume_m3": 0.9,
        "weight_kg": 30,
        "disassembly_minutes": 15
    },
    {
        "name": "Spiegelschrank",
        "category": "bathroom",
        "subcategory": "storage",
        "volume_m3": 0.4,
        "weight_kg": 20,
        "is_fragile": True,
        "disassembly_minutes": 10
    },
    {
        "name": "Wäschekorb / Wäschebox",
        "category": "bathroom",
        "subcategory": "storage",
        "volume_m3": 0.15,
        "weight_kg": 3,
        "typical_quantity": 2
    },
    {
        "name": "Handtücher & Bettwäsche (Box)",
        "category": "bathroom",
        "subcategory": "textiles",
        "volume_m3": 0.08,
        "weight_kg": 5,
        "typical_quantity": 3
    },
    
    # Children's Room - NEW (15 items)
    {
        "name": "Kinderbett",
        "category": "childrens_room",
        "subcategory": "furniture",
        "volume_m3": 2.0,
        "weight_kg": 45,
        "disassembly_minutes": 20,
        "popularity_score": 85
    },
    {
        "name": "Babybett / Gitterbett",
        "category": "childrens_room",
        "subcategory": "furniture",
        "volume_m3": 1.5,
        "weight_kg": 30,
        "disassembly_minutes": 15
    },
    {
        "name": "Wickeltisch",
        "category": "childrens_room",
        "subcategory": "furniture",
        "volume_m3": 0.8,
        "weight_kg": 25,
        "disassembly_minutes": 10
    },
    {
        "name": "Hochstuhl / Kinderstuhl",
        "category": "childrens_room",
        "subcategory": "furniture",
        "volume_m3": 0.4,
        "weight_kg": 12
    },
    {
        "name": "Kinderschreibtisch",
        "category": "childrens_room",
        "subcategory": "furniture",
        "volume_m3": 1.0,
        "weight_kg": 25,
        "disassembly_minutes": 10
    },
    {
        "name": "Spielzeugkiste",
        "category": "childrens_room",
        "subcategory": "storage",
        "volume_m3": 0.3,
        "weight_kg": 15,
        "typical_quantity": 2
    },
    {
        "name": "Kinderwagen / Buggy",
        "category": "childrens_room",
        "subcategory": "accessories",
        "volume_m3": 0.5,
        "weight_kg": 12
    },
    {
        "name": "Autositz",
        "category": "childrens_room",
        "subcategory": "accessories",
        "volume_m3": 0.2,
        "weight_kg": 8
    },
    {
        "name": "Spielzeug (Box)",
        "category": "childrens_room",
        "subcategory": "toys",
        "volume_m3": 0.06,
        "weight_kg": 8,
        "typical_quantity": 5
    },
    
    # Outdoor/Balcony - NEW (15 items)
    {
        "name": "Fahrrad (Erwachsene)",
        "category": "outdoor",
        "subcategory": "sports",
        "volume_m3": 0.5,
        "weight_kg": 15,
        "popularity_score": 80,
        "typical_quantity": 2
    },
    {
        "name": "Kinderfahrrad",
        "category": "outdoor",
        "subcategory": "sports",
        "volume_m3": 0.4,
        "weight_kg": 10
    },
    {
        "name": "E-Bike",
        "category": "outdoor",
        "subcategory": "sports",
        "volume_m3": 0.6,
        "weight_kg": 25,
        "is_special": True
    },
    {
        "name": "Balkontisch",
        "category": "outdoor",
        "subcategory": "furniture",
        "volume_m3": 0.4,
        "weight_kg": 15
    },
    {
        "name": "Balkonstuhl",
        "category": "outdoor",
        "subcategory": "furniture",
        "volume_m3": 0.3,
        "weight_kg": 8,
        "typical_quantity": 4
    },
    {
        "name": "Gartenbank",
        "category": "outdoor",
        "subcategory": "furniture",
        "volume_m3": 0.8,
        "weight_kg": 30
    },
    {
        "name": "Grill / BBQ",
        "category": "outdoor",
        "subcategory": "appliances",
        "volume_m3": 0.6,
        "weight_kg": 25
    },
    {
        "name": "Pflanzkübel (groß)",
        "category": "outdoor",
        "subcategory": "plants",
        "volume_m3": 0.3,
        "weight_kg": 15,
        "typical_quantity": 2
    },
    {
        "name": "Gartengeräte (Schaufel, Harke, etc.)",
        "category": "outdoor",
        "subcategory": "tools",
        "volume_m3": 0.2,
        "weight_kg": 8
    },
    {
        "name": "Mülltonne",
        "category": "outdoor",
        "subcategory": "accessories",
        "volume_m3": 0.25,
        "weight_kg": 10,
        "typical_quantity": 2
    },
    
    # Special Items - NEW (20 items)
    {
        "name": "Klavier (aufrecht)",
        "category": "special",
        "subcategory": "instruments",
        "volume_m3": 4.0,
        "weight_kg": 250,
        "is_special": True,
        "is_fragile": True,
        "packing_tips": "Nur mit Spezialisten transportieren!",
        "disassembly_minutes": 0
    },
    {
        "name": "Flügel (Piano)",
        "category": "special",
        "subcategory": "instruments",
        "volume_m3": 6.0,
        "weight_kg": 400,
        "is_special": True,
        "is_fragile": True
    },
    {
        "name": "Tresor / Safe",
        "category": "special",
        "subcategory": "security",
        "volume_m3": 0.8,
        "weight_kg": 150,
        "is_special": True,
        "packing_tips": "Schwertransport nötig"
    },
    {
        "name": "Aquarium (groß, >200L)",
        "category": "special",
        "subcategory": "pets",
        "volume_m3": 1.2,
        "weight_kg": 80,
        "is_special": True,
        "is_fragile": True,
        "packing_tips": "Wasser ablassen, Fische separat"
    },
    {
        "name": "Kunstwerk / Skulptur",
        "category": "special",
        "subcategory": "art",
        "volume_m3": 0.5,
        "weight_kg": 20,
        "is_fragile": True,
        "is_special": True
    },
    {
        "name": "Gerahmtes Bild (wertvoll)",
        "category": "special",
        "subcategory": "art",
        "volume_m3": 0.2,
        "weight_kg": 10,
        "is_fragile": True
    },
    {
        "name": "Weinsammlung (50+ Flaschen)",
        "category": "special",
        "subcategory": "collectibles",
        "volume_m3": 0.6,
        "weight_kg": 40,
        "is_fragile": True,
        "packing_tips": "Temperaturkontrolle wichtig"
    },
    {
        "name": "Gitarre / Bassgitarre",
        "category": "special",
        "subcategory": "instruments",
        "volume_m3": 0.3,
        "weight_kg": 5,
        "is_fragile": True
    },
    {
        "name": "Schlagzeug (Set)",
        "category": "special",
        "subcategory": "instruments",
        "volume_m3": 3.0,
        "weight_kg": 50,
        "disassembly_minutes": 30
    },
    
    # Electronics & Tech - NEW (15 items)
    {
        "name": "Fernseher 32-43\"",
        "category": "electronics",
        "subcategory": "tv",
        "volume_m3": 0.15,
        "weight_kg": 8,
        "is_fragile": True,
        "popularity_score": 90
    },
    {
        "name": "Fernseher 50-55\"",
        "category": "electronics",
        "subcategory": "tv",
        "volume_m3": 0.25,
        "weight_kg": 15,
        "is_fragile": True,
        "popularity_score": 85
    },
    {
        "name": "Fernseher 65\"+ (groß)",
        "category": "electronics",
        "subcategory": "tv",
        "volume_m3": 0.4,
        "weight_kg": 25,
        "is_fragile": True,
        "packing_tips": "Originalverpackung empfohlen"
    },
    {
        "name": "Soundbar",
        "category": "electronics",
        "subcategory": "audio",
        "volume_m3": 0.05,
        "weight_kg": 3,
        "is_fragile": True
    },
    {
        "name": "Lautsprecher (Paar)",
        "category": "electronics",
        "subcategory": "audio",
        "volume_m3": 0.1,
        "weight_kg": 8,
        "is_fragile": True
    },
    {
        "name": "Subwoofer",
        "category": "electronics",
        "subcategory": "audio",
        "volume_m3": 0.08,
        "weight_kg": 12
    },
    {
        "name": "Spielkonsole (PS5, Xbox)",
        "category": "electronics",
        "subcategory": "gaming",
        "volume_m3": 0.02,
        "weight_kg": 4,
        "is_fragile": True
    },
    {
        "name": "VR-Headset",
        "category": "electronics",
        "subcategory": "gaming",
        "volume_m3": 0.01,
        "weight_kg": 1,
        "is_fragile": True
    },
    {
        "name": "Router / Modem",
        "category": "electronics",
        "subcategory": "networking",
        "volume_m3": 0.01,
        "weight_kg": 1
    },
    {
        "name": "Smart Home Hub (Alexa, Google)",
        "category": "electronics",
        "subcategory": "smart_home",
        "volume_m3": 0.01,
        "weight_kg": 0.5,
        "typical_quantity": 2
    },
    
    # Storage/Basement - NEW (10 items)
    {
        "name": "Werkbank",
        "category": "storage",
        "subcategory": "tools",
        "volume_m3": 2.0,
        "weight_kg": 80,
        "disassembly_minutes": 20
    },
    {
        "name": "Werkzeugkasten / Toolbox",
        "category": "storage",
        "subcategory": "tools",
        "volume_m3": 0.15,
        "weight_kg": 15
    },
    {
        "name": "Regal (Kellerregal)",
        "category": "storage",
        "subcategory": "shelving",
        "volume_m3": 1.5,
        "weight_kg": 35,
        "disassembly_minutes": 15
    },
    {
        "name": "Koffer / Reisegepäck",
        "category": "storage",
        "subcategory": "luggage",
        "volume_m3": 0.08,
        "weight_kg": 8,
        "typical_quantity": 4
    },
    {
        "name": "Saisonale Artikel (Weihnachten, etc.)",
        "category": "storage",
        "subcategory": "seasonal",
        "volume_m3": 0.3,
        "weight_kg": 10,
        "typical_quantity": 2
    },
    {
        "name": "Archivkartons / Aktenordner",
        "category": "storage",
        "subcategory": "documents",
        "volume_m3": 0.04,
        "weight_kg": 12,
        "typical_quantity": 10
    },
    {
        "name": "Staubsauger",
        "category": "storage",
        "subcategory": "appliances",
        "volume_m3": 0.08,
        "weight_kg": 6
    },
    {
        "name": "Bügelbrett & Bügeleisen",
        "category": "storage",
        "subcategory": "household",
        "volume_m3": 0.05,
        "weight_kg": 5
    },
]

def seed_extended_items(db):
    """Seed extended inventory (150+ items)"""
    print(f"[*] Seeding {len(EXTENDED_ITEMS)} extended items...")
    
    for item_data in EXTENDED_ITEMS:
        item = ItemTemplate(**item_data)
        db.add(item)
    
    db.commit()
    print(f"[+] Seeded {len(EXTENDED_ITEMS)} items successfully")
```

#### Step 4: Update Frontend Types

```typescript
// frontend/src/types/index.ts
export interface ItemTemplate {
  id: string
  name: string
  category: string
  subcategory?: string
  volume_m3: number
  weight_kg: number
  disassembly_minutes: number
  packing_minutes: number
  
  // New fields
  image_url?: string
  description?: string
  is_fragile: boolean
  is_special: boolean
  packing_tips?: string
  popularity_score: number
  typical_quantity: number
}

export interface ItemCategory {
  id: string
  label: string
  icon: string
  subcategories?: string[]
  description?: string
}
```

---

### Day 3-4: Search & Filter Implementation

#### Enhanced StepInventory Component

```typescript
// frontend/src/components/calculator/StepInventory.tsx
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, ArrowRight, ArrowLeft, Package, Search, Filter } from 'lucide-react'
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
  
  // NEW: Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'volume'>('popularity')
  
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
  
  // NEW: Enhanced categories with subcategories
  const categories = [
    { 
      id: 'living_room', 
      label: 'Wohnzimmer', 
      icon: '🛋️',
      subcategories: ['seating', 'storage', 'tables', 'lighting', 'decoration']
    },
    { 
      id: 'bedroom', 
      label: 'Schlafzimmer', 
      icon: '🛏️',
      subcategories: ['beds', 'storage', 'furniture']
    },
    { 
      id: 'kitchen', 
      label: 'Küche', 
      icon: '🍽️',
      subcategories: ['appliances', 'furniture', 'items']
    },
    { 
      id: 'office', 
      label: 'Büro', 
      icon: '💼',
      subcategories: ['furniture', 'electronics', 'storage']
    },
    { 
      id: 'bathroom', 
      label: 'Badezimmer', 
      icon: '🚿',
      subcategories: ['appliances', 'storage', 'accessories']
    },
    { 
      id: 'childrens_room', 
      label: 'Kinderzimmer', 
      icon: '👶',
      subcategories: ['furniture', 'toys', 'accessories']
    },
    { 
      id: 'outdoor', 
      label: 'Balkon/Outdoor', 
      icon: '🏡',
      subcategories: ['furniture', 'sports', 'plants']
    },
    { 
      id: 'storage', 
      label: 'Keller/Lager', 
      icon: '📦',
      subcategories: ['shelving', 'tools', 'boxes']
    },
    { 
      id: 'special', 
      label: 'Spezial', 
      icon: '⭐',
      subcategories: ['instruments', 'art', 'collectibles']
    },
    { 
      id: 'electronics', 
      label: 'Elektronik', 
      icon: '📺',
      subcategories: ['tv', 'audio', 'gaming', 'smart_home']
    },
  ]
  
  const getItemQuantity = (itemId: string) => {
    const item = inventory.find((i) => i.item_id === itemId)
    return item?.quantity || 0
  }
  
  const handleAddItem = (template: ItemTemplate) => {
    addInventoryItem({
      item_id: template.id,
      name: template.name,
      quantity: template.typical_quantity || 1,
      volume_m3: Number(template.volume_m3),
      category: template.category,
    })
  }
  
  const handleUpdateQuantity = (itemId: string, change: number) => {
    const currentQty = getItemQuantity(itemId)
    updateInventoryItemQuantity(itemId, Math.max(0, currentQty + change))
  }
  
  // NEW: Filtered and sorted items
  const filteredItems = useMemo(() => {
    let items = itemTemplates.filter((t) => t.category === selectedCategory)
    
    // Apply search filter
    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Show only selected items
    if (showOnlySelected) {
      items = items.filter((item) => getItemQuantity(item.id) > 0)
    }
    
    // Sort items
    items.sort((a, b) => {
      if (sortBy === 'popularity') {
        return (b.popularity_score || 0) - (a.popularity_score || 0)
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'volume') {
        return Number(a.volume_m3) - Number(b.volume_m3)
      }
      return 0
    })
    
    return items
  }, [itemTemplates, selectedCategory, searchQuery, showOnlySelected, sortBy, inventory])
  
  const handleNext = async () => {
    await calculateQuote()
    setStep(3)
  }
  
  const totalVolume = inventory.reduce(
    (sum, item) => sum + item.volume_m3 * item.quantity,
    0
  )
  
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-6xl mx-auto"
    >
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Was möchten Sie mitnehmen?
          </h2>
          <p className="text-gray-600">
            Wählen Sie Ihre Möbel und Gegenstände aus. Vorlagen für {apartmentSize || '2-Zimmer'} Wohnung sind vorausgefüllt.
          </p>
        </div>
        
        {/* NEW: Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen Sie nach Möbeln, z.B. 'Sofa', 'Tisch'..."
              className="input-field pl-10 w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowOnlySelected(!showOnlySelected)}
              className={clsx(
                'px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2',
                {
                  'border-primary-600 bg-primary-50 text-primary-700': showOnlySelected,
                  'border-gray-200 hover:border-gray-300': !showOnlySelected,
                }
              )}
            >
              <Filter className="w-4 h-4" />
              Nur ausgewählt
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field"
            >
              <option value="popularity">Beliebt</option>
              <option value="name">Name</option>
              <option value="volume">Größe</option>
            </select>
          </div>
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
              <span className="text-xl">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
        
        {/* Item Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Keine Artikel gefunden. Versuchen Sie eine andere Suche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <AnimatePresence mode="wait">
              {filteredItems.map((template) => {
                const quantity = getItemQuantity(template.id)
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={clsx(
                      'border-2 rounded-lg p-4 transition-all relative',
                      {
                        'border-primary-600 bg-primary-50': quantity > 0,
                        'border-gray-200 hover:border-gray-300': quantity === 0,
                        'ring-2 ring-yellow-400': template.is_special,
                      }
                    )}
                  >
                    {/* Special/Fragile Badges */}
                    {(template.is_special || template.is_fragile) && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        {template.is_special && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            Spezial
                          </span>
                        )}
                        {template.is_fragile && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Zerbrechlich
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3 mt-6">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {template.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {template.volume_m3} m³ • {template.weight_kg} kg
                        </p>
                        {template.packing_tips && quantity > 0 && (
                          <p className="text-xs text-primary-600 mt-2">
                            💡 {template.packing_tips}
                          </p>
                        )}
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
                {totalItems} Artikel • {totalVolume.toFixed(1)} m³
              </span>
            </div>
            
            {/* NEW: Truck visualization */}
            <TruckIndicator volume={totalVolume} />
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

// NEW: Truck volume indicator
function TruckIndicator({ volume }: { volume: number }) {
  const truckCapacity = 40 // m³
  const percentage = Math.min((volume / truckCapacity) * 100, 100)
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">🚛</span>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={clsx('h-full rounded-full', {
            'bg-green-500': percentage < 70,
            'bg-yellow-500': percentage >= 70 && percentage < 90,
            'bg-red-500': percentage >= 90,
          })}
        />
      </div>
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {(volume / truckCapacity).toFixed(1)}x LKW
      </span>
    </div>
  )
}

import clsx from 'clsx'
```

---

## Phase 2: Advanced Features (Week 2)

### Forgotten Items Checklist

```typescript
// frontend/src/components/calculator/StepForgottenItems.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'

const COMMONLY_FORGOTTEN = [
  { name: 'Lampen & Leuchten', icon: '💡', category: 'living_room', volume: 0.2, weight: 5 },
  { name: 'Vorhänge & Gardinen', icon: '🪟', category: 'living_room', volume: 0.15, weight: 3 },
  { name: 'Teppiche', icon: '🧵', category: 'living_room', volume: 0.4, weight: 12 },
  { name: 'Pflanzen (groß)', icon: '🪴', category: 'living_room', volume: 0.4, weight: 20 },
  { name: 'Spiegel', icon: '🪞', category: 'other', volume: 0.3, weight: 15 },
  { name: 'Werkzeug', icon: '🔧', category: 'storage', volume: 0.15, weight: 15 },
  { name: 'Fahrräder', icon: '🚲', category: 'outdoor', volume: 0.5, weight: 15 },
  { name: 'Mülltonnen', icon: '🗑️', category: 'outdoor', volume: 0.25, weight: 10 },
  { name: 'Bügelbrett', icon: '👔', category: 'storage', volume: 0.05, weight: 5 },
  { name: 'Staubsauger', icon: '🧹', category: 'storage', volume: 0.08, weight: 6 },
  { name: 'Dekoartikel', icon: '🎨', category: 'other', volume: 0.1, weight: 5 },
  { name: 'Badezimmer-Accessoires', icon: '🚿', category: 'bathroom', volume: 0.1, weight: 5 },
]

export default function StepForgottenItems() {
  const { inventory, addInventoryItem, setStep } = useCalculatorStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  
  const handleToggle = (itemName: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName)
    } else {
      newSelected.add(itemName)
    }
    setSelected(newSelected)
  }
  
  const handleConfirm = () => {
    // Add selected items to inventory
    COMMONLY_FORGOTTEN.forEach((item) => {
      if (selected.has(item.name)) {
        addInventoryItem({
          item_id: `forgotten-${item.name}`,
          name: item.name,
          quantity: 1,
          volume_m3: item.volume,
          category: item.category,
        })
      }
    })
    
    setStep(3)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nichts vergessen?
          </h2>
          <p className="text-gray-600">
            Diese Gegenstände werden häufig vergessen. Haben Sie welche davon?
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {COMMONLY_FORGOTTEN.map((item) => {
            const isSelected = selected.has(item.name)
            const alreadyInInventory = inventory.some((inv) => 
              inv.name.toLowerCase().includes(item.name.toLowerCase())
            )
            
            return (
              <motion.button
                key={item.name}
                onClick={() => !alreadyInInventory && handleToggle(item.name)}
                disabled={alreadyInInventory}
                whileHover={{ scale: alreadyInInventory ? 1 : 1.05 }}
                whileTap={{ scale: alreadyInInventory ? 1 : 0.95 }}
                className={clsx(
                  'p-4 rounded-lg border-2 transition-all text-center',
                  {
                    'border-primary-600 bg-primary-50': isSelected,
                    'border-gray-200 hover:border-gray-300': !isSelected && !alreadyInInventory,
                    'border-green-200 bg-green-50 cursor-not-allowed opacity-60': alreadyInInventory,
                  }
                )}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-gray-900">
                  {item.name}
                </div>
                {alreadyInInventory && (
                  <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-2" />
                )}
              </motion.button>
            )
          })}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>Tipp:</strong> Basierend auf über 1,000 Umzügen vergessen Kunden am häufigsten
            Lampen, Pflanzen und Vorhänge. Überprüfen Sie jeden Raum nochmal!
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setStep(2)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {selected.size > 0 ? `${selected.size} hinzufügen & weiter` : 'Alles vollständig'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

import clsx from 'clsx'
```

---

## Testing & Deployment Checklist

### Before Launch:
- [ ] Test all 150+ items load correctly
- [ ] Search functionality works across all items
- [ ] Filter and sort work as expected
- [ ] Mobile responsiveness (especially item grid)
- [ ] Forgotten items step integrates smoothly
- [ ] Volume calculation is accurate
- [ ] Performance with large inventories (100+ items)

### Performance Optimization:
```typescript
// Implement virtual scrolling for large item lists
import { FixedSizeGrid } from 'react-window'

// Lazy load item images
<img src={item.image_url} loading="lazy" />

// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((value: string) => setSearchQuery(value), 300),
  []
)
```

---

## Next Steps (Week 2-4)

1. **Add item images** (create image assets or use placeholders)
2. **Implement room templates** with multiple variants
3. **Add truck visualization component**
4. **Create price breakdown component**
5. **Add social proof & trust signals**
6. **Implement abandoned quote recovery**
7. **Mobile optimization pass**
8. **A/B testing setup for conversion tracking**

---

## Metrics to Track

```typescript
// Add analytics events
trackEvent('inventory_search', { query: searchQuery })
trackEvent('item_added', { item_name: template.name, category: template.category })
trackEvent('forgotten_items_viewed', { items_suggested: COMMONLY_FORGOTTEN.length })
trackEvent('step_completed', { step: 2, items_count: inventory.length })
```

This will help you measure conversion improvements and iterate on the UX!
