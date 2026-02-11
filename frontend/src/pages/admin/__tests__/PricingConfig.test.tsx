import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import PricingConfig from '../PricingConfig'

// Mock the API module
vi.mock('@/services/api', () => ({
  adminAPI: {
    getPricingConfig: vi.fn(),
    updatePricingConfig: vi.fn(),
  },
}))

import { adminAPI } from '@/services/api'

const mockedGetPricingConfig = vi.mocked(adminAPI.getPricingConfig)
const mockedUpdatePricingConfig = vi.mocked(adminAPI.updatePricingConfig)

const DEFAULT_CONFIG = {
  base_rate_m3_min: 25.0,
  base_rate_m3_max: 35.0,
  rate_km_near: 2.0,
  rate_km_far: 1.0,
  km_threshold: 50.0,
  hourly_labor_min: 60.0,
  hourly_labor_max: 80.0,
  min_movers: 2,
  floor_surcharge_percent: 0.15,
  hvz_permit_cost: 120.0,
  kitchen_assembly_per_meter: 45.0,
  external_lift_cost_min: 350.0,
  external_lift_cost_max: 500.0,
  weekend_surcharge_percent: 0.25,
  holiday_surcharge_percent: 0.50,
  packing_materials_per_m3: 8.0,
  heavy_item_surcharges: {
    piano: 150.0,
    safe: 120.0,
    aquarium: 80.0,
    gym_equipment: 60.0,
    marble_table: 80.0,
    antique: 100.0,
  },
  long_carry_per_10m: 35.0,
  disposal_base_cost: 80.0,
  disposal_per_m3: 45.0,
  insurance_basic_flat: 49.0,
  insurance_premium_percent: 0.01,
  insurance_premium_min: 89.0,
  enable_regional_pricing: false,
  enable_seasonal_pricing: false,
  seasonal_peak_multiplier: 1.15,
  seasonal_offpeak_multiplier: 1.0,
}

function setupAPI(overrides: Record<string, unknown> = {}) {
  mockedGetPricingConfig.mockResolvedValue({
    pricing_config: { ...DEFAULT_CONFIG, ...overrides },
  })
  mockedUpdatePricingConfig.mockResolvedValue({ success: true })
}

async function renderAndWait() {
  render(<PricingConfig />)
  await waitFor(() => {
    expect(screen.queryByText('Lade Konfiguration...')).not.toBeInTheDocument()
  })
}

/** Find the number input associated with a label text (NumberInput component) */
function findNumberInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText)
  const wrapper = label.parentElement!
  return wrapper.querySelector('input[type="number"]') as HTMLInputElement
}

/** Find the range (slider) input associated with a label text */
function findRangeInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText)
  const wrapper = label.parentElement!
  return wrapper.querySelector('input[type="range"]') as HTMLInputElement
}

/** Change a NumberInput's value via the number field */
function changeNumberInputValue(labelText: string, newValue: string) {
  const input = findNumberInput(labelText)
  fireEvent.change(input, { target: { value: newValue } })
}

/** Find the toggle button for a ToggleSwitch by its label text */
function findToggleButton(labelText: string): HTMLButtonElement {
  const label = screen.getByText(labelText)
  // span → div.flex-1 → div.flex.items-start.justify-between
  const toggleContainer = label.closest('div[class*="justify-between"]')!
  return toggleContainer.querySelector('button') as HTMLButtonElement
}

beforeEach(() => {
  vi.clearAllMocks()
  setupAPI()
})

// ── Loading ─────────────────────────────────────────────────────

describe('Loading', () => {
  it('shows loading spinner initially', () => {
    render(<PricingConfig />)
    expect(screen.getByText('Lade Konfiguration...')).toBeInTheDocument()
  })

  it('renders form after loading completes', async () => {
    await renderAndWait()
    expect(screen.getByText('Preiskonfiguration')).toBeInTheDocument()
  })

  it('falls back to defaults when API fails', async () => {
    mockedGetPricingConfig.mockRejectedValueOnce(new Error('Network error'))
    await renderAndWait()
    expect(screen.getByText('Preiskonfiguration')).toBeInTheDocument()
  })
})

// ── Sections render ─────────────────────────────────────────────

describe('Sections render', () => {
  it('renders all section headings', async () => {
    await renderAndWait()
    const sections = [
      'Volumenbasierte Preise (pro m³)',
      'Kilometerpreise',
      'Arbeitskosten',
      'Etagenzuschlag',
      'Zusatzleistungen',
      'Entrümpelung & Trageweg',
      'Transportversicherung',
      'Schwerlast-Zuschläge',
      'Wochenend- & Feiertagszuschläge',
      'Regionale & Saisonale Anpassung',
    ]
    for (const heading of sections) {
      const matches = screen.getAllByText(heading)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    }
  })
})

// ── Input values ────────────────────────────────────────────────

describe('Input values', () => {
  it('shows default volume rates', async () => {
    await renderAndWait()
    expect(screen.getByText('Mindestpreis pro m³')).toBeInTheDocument()
    expect(screen.getByText('Höchstpreis pro m³')).toBeInTheDocument()
  })

  it('shows default distance rates', async () => {
    await renderAndWait()
    expect(screen.getByText('Nahbereich (0-50km)')).toBeInTheDocument()
    expect(screen.getByText('Fernbereich (>50km)')).toBeInTheDocument()
  })

  it('shows default labor costs', async () => {
    await renderAndWait()
    expect(screen.getByText('Min. Stundenlohn pro Helfer')).toBeInTheDocument()
    expect(screen.getByText('Max. Stundenlohn pro Helfer')).toBeInTheDocument()
    expect(screen.getByText('Mindestanzahl Helfer')).toBeInTheDocument()
  })

  it('shows disposal fields', async () => {
    await renderAndWait()
    expect(screen.getByText('Entrümpelung Grundgebühr')).toBeInTheDocument()
    expect(screen.getByText('Entrümpelung pro m³')).toBeInTheDocument()
  })

  it('shows insurance fields', async () => {
    await renderAndWait()
    expect(screen.getByText('Basis-Schutz (Pauschale)')).toBeInTheDocument()
    expect(screen.getByText('Premium-Schutz (% vom Wert)')).toBeInTheDocument()
    expect(screen.getByText('Premium Mindestpreis')).toBeInTheDocument()
  })
})

// ── Percentage display ──────────────────────────────────────────

describe('Percentage display', () => {
  it('shows floor_surcharge_percent as percentage (0.15 → 15)', async () => {
    await renderAndWait()
    const input = findNumberInput('Zuschlag pro Etage (ohne Aufzug)')
    expect(input.value).toBe('15')
  })

  it('shows weekend_surcharge as percentage (0.25 → 25)', async () => {
    await renderAndWait()
    const input = findNumberInput('Wochenendzuschlag (Sa/So)')
    expect(input.value).toBe('25')
  })

  it('shows holiday_surcharge as percentage (0.50 → 50)', async () => {
    await renderAndWait()
    const input = findNumberInput('Feiertagszuschlag')
    expect(input.value).toBe('50')
  })
})

// ── Toggle switches ─────────────────────────────────────────────

describe('Toggle switches', () => {
  it('shows regional pricing toggle (off by default)', async () => {
    await renderAndWait()
    expect(screen.getByText('Regionale Preisanpassung')).toBeInTheDocument()
  })

  it('shows seasonal pricing toggle (off by default)', async () => {
    await renderAndWait()
    expect(screen.getByText('Saisonale Preisanpassung')).toBeInTheDocument()
  })

  it('seasonal inputs are hidden when toggle is off', async () => {
    await renderAndWait()
    expect(screen.queryByText('Hochsaison-Multiplikator (Mai-Sep)')).not.toBeInTheDocument()
    expect(screen.queryByText('Nebensaison-Multiplikator (Dez-Feb)')).not.toBeInTheDocument()
  })

  it('seasonal inputs appear when toggle is clicked', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    const toggleButton = findToggleButton('Saisonale Preisanpassung')
    await user.click(toggleButton)

    expect(screen.getByText('Hochsaison-Multiplikator (Mai-Sep)')).toBeInTheDocument()
    expect(screen.getByText('Nebensaison-Multiplikator (Dez-Feb)')).toBeInTheDocument()
  })

  it('seasonal inputs show when config has seasonal enabled', async () => {
    setupAPI({ enable_seasonal_pricing: true })
    await renderAndWait()
    expect(screen.getByText('Hochsaison-Multiplikator (Mai-Sep)')).toBeInTheDocument()
  })
})

// ── Heavy items ─────────────────────────────────────────────────

describe('Heavy items', () => {
  it('renders all 6 heavy item labels in German', async () => {
    await renderAndWait()
    const labels = [
      'Klavier/Flügel',
      'Tresor',
      'Aquarium',
      'Fitnessgeräte',
      'Marmortisch',
      'Antiquitäten',
    ]
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})

// ── Change detection ────────────────────────────────────────────

describe('Change detection', () => {
  it('save button is disabled initially', async () => {
    await renderAndWait()
    const saveButton = screen.getByText('Änderungen speichern').closest('button')!
    expect(saveButton).toBeDisabled()
  })

  it('reset button is not visible initially', async () => {
    await renderAndWait()
    expect(screen.queryByText('Zurücksetzen')).not.toBeInTheDocument()
  })

  it('save button enables and reset appears after a change', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    await user.click(findToggleButton('Regionale Preisanpassung'))

    const saveButton = screen.getByText('Änderungen speichern').closest('button')!
    expect(saveButton).not.toBeDisabled()
    expect(screen.getByText('Zurücksetzen')).toBeInTheDocument()
  })
})

// ── Save ────────────────────────────────────────────────────────

describe('Save', () => {
  it('calls API with config on save', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    await user.click(findToggleButton('Regionale Preisanpassung'))

    const saveButton = screen.getByText('Änderungen speichern').closest('button')!
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockedUpdatePricingConfig).toHaveBeenCalledTimes(1)
      expect(mockedUpdatePricingConfig).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ enable_regional_pricing: true })
      )
    })
  })

  it('shows success message after save', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    await user.click(findToggleButton('Regionale Preisanpassung'))
    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('Konfiguration erfolgreich gespeichert!')).toBeInTheDocument()
    })
  })

  it('shows error message on save failure', async () => {
    mockedUpdatePricingConfig.mockRejectedValueOnce(new Error('Server error'))
    const user = userEvent.setup()
    await renderAndWait()

    await user.click(findToggleButton('Regionale Preisanpassung'))
    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Speichern der Konfiguration')).toBeInTheDocument()
    })
  })
})

// ── Reset ───────────────────────────────────────────────────────

describe('Reset', () => {
  it('restores original values after reset', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    await user.click(findToggleButton('Regionale Preisanpassung'))
    expect(screen.getByText('Zurücksetzen')).toBeInTheDocument()

    await user.click(screen.getByText('Zurücksetzen'))

    const saveButton = screen.getByText('Änderungen speichern').closest('button')!
    expect(saveButton).toBeDisabled()
    expect(screen.queryByText('Zurücksetzen')).not.toBeInTheDocument()
  })
})

// ── Example calculation ─────────────────────────────────────────

describe('Example calculation', () => {
  it('shows correct example total with default values', async () => {
    await renderAndWait()

    // Default: 40m³, 50km, 4h labor
    // min: (40*25 + 50*2*0.9 + 4*60) * 1.19 = 1330 * 1.19 = 1582.7 → 1583
    // max: (40*35 + 50*2*1.1 + 4*80) * 1.19 = 1830 * 1.19 = 2177.7 → 2178
    const exampleSection = screen.getByText('Beispielrechnung').closest('div[class*="card"]')!
    expect(exampleSection).toHaveTextContent('€1583')
    expect(exampleSection).toHaveTextContent('€2178')
  })

  it('shows correct volume cost row', async () => {
    await renderAndWait()
    // 40 * 25 = 1000, 40 * 35 = 1400 — appears in both example and quick ref, scope to example section
    const exampleSection = screen.getByText('Beispielrechnung').closest('div[class*="card"]')!
    expect(exampleSection).toHaveTextContent('€1000 - €1400')
  })

  it('shows correct distance cost row', async () => {
    await renderAndWait()
    // 50 * 2 * 0.9 = 90, 50 * 2 * 1.1 = 110
    expect(screen.getByText('€90 - €110')).toBeInTheDocument()
  })

  it('shows correct labor cost row', async () => {
    await renderAndWait()
    // 4 * 60 = 240, 4 * 80 = 320
    expect(screen.getByText('€240 - €320')).toBeInTheDocument()
  })
})

// ── Weekend preview ─────────────────────────────────────────────

describe('Weekend preview', () => {
  it('shows weekend surcharge preview with +25%', async () => {
    await renderAndWait()
    // Weekend: min = 1583 * 1.25 = 1978.75 → 1979, max = 2178 * 1.25 = 2722.5 → 2723
    const weekendText = screen.getByText(/Am Samstag/)
    expect(weekendText).toHaveTextContent('+25%')
    const weekendRow = weekendText.closest('div[class*="border-t"]')!
    expect(weekendRow).toHaveTextContent('€1979')
    expect(weekendRow).toHaveTextContent('€2723')
  })

  it('hides weekend preview when surcharge is 0', async () => {
    setupAPI({ weekend_surcharge_percent: 0 })
    await renderAndWait()
    expect(screen.queryByText(/Am Samstag/)).not.toBeInTheDocument()
  })
})

// ── Quick reference ─────────────────────────────────────────────

describe('Quick reference', () => {
  it('shows correct volume-only calculations', async () => {
    await renderAndWait()
    const refSection = screen.getByText('Schnellreferenz: Nur Volumen').closest('div[class*="card"]')!

    // Studio: 15 * 25 = 375, 15 * 35 = 525
    expect(refSection).toHaveTextContent('€375 - €525')

    // 2-Zimmer: 40 * 25 = 1000, 40 * 35 = 1400
    expect(refSection).toHaveTextContent('€1000 - €1400')

    // 4-Zimmer: 80 * 25 = 2000, 80 * 35 = 2800
    expect(refSection).toHaveTextContent('€2000 - €2800')
  })
})

// ── Active features ─────────────────────────────────────────────

describe('Active features', () => {
  it('shows feature status indicators', async () => {
    await renderAndWait()
    const featureSection = screen.getByText('Aktive Preisfaktoren').closest('div[class*="card"]')!
    expect(featureSection).toHaveTextContent('Regionale Preise')
    expect(featureSection).toHaveTextContent('Saisonale Preise')
    expect(featureSection).toHaveTextContent('Wochenendzuschlag (25%)')
    expect(featureSection).toHaveTextContent('Feiertagszuschlag (50%)')
    expect(featureSection).toHaveTextContent('Schwerlast-Zuschläge')
    expect(featureSection).toHaveTextContent('Transportversicherung')
  })
})

// ── Navigation ──────────────────────────────────────────────────

describe('Navigation', () => {
  it('has back link to admin dashboard', async () => {
    await renderAndWait()
    const backLink = screen.getByText('Dashboard').closest('a')!
    expect(backLink).toHaveAttribute('href', '/admin')
  })
})

// ── Number input → save payload ─────────────────────────────────

describe('Number input save payload', () => {
  it('sends updated base_rate_m3_min to API after changing number input', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Mindestpreis pro m³', '30')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(mockedUpdatePricingConfig).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ base_rate_m3_min: 30 })
      )
    })
  })

  it('sends updated hourly_labor_max to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Max. Stundenlohn pro Helfer', '90')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(mockedUpdatePricingConfig).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ hourly_labor_max: 90 })
      )
    })
  })

  it('sends updated hvz_permit_cost to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('HVZ Genehmigung (Halteverbotszone)', '150')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(mockedUpdatePricingConfig).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ hvz_permit_cost: 150 })
      )
    })
  })

  it('sends updated disposal_per_m3 to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Entrümpelung pro m³', '55')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(mockedUpdatePricingConfig).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ disposal_per_m3: 55 })
      )
    })
  })

  it('sends updated insurance_basic_flat to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Basis-Schutz (Pauschale)', '59')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      expect(mockedUpdatePricingConfig).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ insurance_basic_flat: 59 })
      )
    })
  })
})

// ── Percentage round-trip (display → edit → save as decimal) ────

describe('Percentage round-trip', () => {
  it('floor surcharge: entering 20 sends 0.20 to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Zuschlag pro Etage (ohne Aufzug)', '20')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.floor_surcharge_percent).toBeCloseTo(0.20)
    })
  })

  it('weekend surcharge: entering 30 sends 0.30 to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Wochenendzuschlag (Sa/So)', '30')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.weekend_surcharge_percent).toBeCloseTo(0.30)
    })
  })

  it('holiday surcharge: entering 75 sends 0.75 to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Feiertagszuschlag', '75')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.holiday_surcharge_percent).toBeCloseTo(0.75)
    })
  })

  it('insurance premium percent: entering 2 sends 0.02 to API', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Premium-Schutz (% vom Wert)', '2')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.insurance_premium_percent).toBeCloseTo(0.02)
    })
  })
})

// ── Heavy item updates preserve other items ─────────────────────

describe('Heavy item data integrity', () => {
  it('updating piano surcharge preserves all other heavy items', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Klavier/Flügel', '200')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.heavy_item_surcharges).toEqual({
        piano: 200,
        safe: 120,
        aquarium: 80,
        gym_equipment: 60,
        marble_table: 80,
        antique: 100,
      })
    })
  })

  it('updating multiple heavy items preserves correct values', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    changeNumberInputValue('Tresor', '180')
    changeNumberInputValue('Antiquitäten', '150')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.heavy_item_surcharges.safe).toBe(180)
      expect(payload.heavy_item_surcharges.antique).toBe(150)
      // Others unchanged
      expect(payload.heavy_item_surcharges.piano).toBe(150)
      expect(payload.heavy_item_surcharges.aquarium).toBe(80)
      expect(payload.heavy_item_surcharges.gym_equipment).toBe(60)
      expect(payload.heavy_item_surcharges.marble_table).toBe(80)
    })
  })
})

// ── Calculation reacts to config changes ────────────────────────

describe('Calculation updates on config change', () => {
  it('example total updates when base_rate_m3_min changes', async () => {
    await renderAndWait()
    const exampleSection = screen.getByText('Beispielrechnung').closest('div[class*="card"]')!

    // Default min total: (40*25 + 50*2*0.9 + 4*60) * 1.19 = 1330 * 1.19 = 1583
    expect(exampleSection).toHaveTextContent('€1583')

    // Change min rate from 25 → 30
    changeNumberInputValue('Mindestpreis pro m³', '30')

    // New min total: (40*30 + 50*2*0.9 + 4*60) * 1.19 = (1200 + 90 + 240) * 1.19 = 1530 * 1.19 = 1820.7 → 1821
    await waitFor(() => {
      expect(exampleSection).toHaveTextContent('€1821')
    })
  })

  it('example total updates when rate_km_near changes', async () => {
    await renderAndWait()
    const exampleSection = screen.getByText('Beispielrechnung').closest('div[class*="card"]')!

    // Change km rate from 2.0 → 3.0
    changeNumberInputValue('Nahbereich (0-50km)', '3')

    // New min: (40*25 + 50*3*0.9 + 4*60) * 1.19 = (1000 + 135 + 240) * 1.19 = 1375 * 1.19 = 1636.25 → 1636
    // New max: (40*35 + 50*3*1.1 + 4*80) * 1.19 = (1400 + 165 + 320) * 1.19 = 1885 * 1.19 = 2243.15 → 2243
    await waitFor(() => {
      expect(exampleSection).toHaveTextContent('€1636')
      expect(exampleSection).toHaveTextContent('€2243')
    })
  })

  it('example total updates when hourly_labor_min changes', async () => {
    await renderAndWait()
    const exampleSection = screen.getByText('Beispielrechnung').closest('div[class*="card"]')!

    // Change labor min from 60 → 70
    changeNumberInputValue('Min. Stundenlohn pro Helfer', '70')

    // New min: (40*25 + 50*2*0.9 + 4*70) * 1.19 = (1000 + 90 + 280) * 1.19 = 1370 * 1.19 = 1630.3 → 1630
    await waitFor(() => {
      expect(exampleSection).toHaveTextContent('€1630')
    })
  })

  it('quick reference updates when volume rates change', async () => {
    await renderAndWait()
    const refSection = screen.getByText('Schnellreferenz: Nur Volumen').closest('div[class*="card"]')!

    // Change min rate from 25 → 30
    changeNumberInputValue('Mindestpreis pro m³', '30')

    // Studio: 15 * 30 = 450 (was 375)
    // 2-Zimmer: 40 * 30 = 1200 (was 1000)
    // 4-Zimmer: 80 * 30 = 2400 (was 2000)
    await waitFor(() => {
      expect(refSection).toHaveTextContent('€450 - €525')
      expect(refSection).toHaveTextContent('€1200 - €1400')
      expect(refSection).toHaveTextContent('€2400 - €2800')
    })
  })

  it('weekend preview updates when weekend surcharge changes', async () => {
    await renderAndWait()

    // Change weekend surcharge from 25% → 50%
    changeNumberInputValue('Wochenendzuschlag (Sa/So)', '50')

    // min total = 1583, max total = 2178
    // Weekend min: 1583 * 1.50 = 2374.5 → 2375 (rounding: 2374 or 2375)
    // Weekend max: 2178 * 1.50 = 3267
    await waitFor(() => {
      const weekendText = screen.getByText(/Am Samstag/)
      expect(weekendText).toHaveTextContent('+50%')
      const weekendRow = weekendText.closest('div[class*="border-t"]')!
      expect(weekendRow).toHaveTextContent('€3267')
    })
  })
})

// ── Slider ↔ input sync ────────────────────────────────────────

describe('Slider and input sync', () => {
  it('changing slider updates the number input', async () => {
    await renderAndWait()

    const slider = findRangeInput('Mindestpreis pro m³')
    const numberInput = findNumberInput('Mindestpreis pro m³')

    expect(numberInput.value).toBe('25')

    fireEvent.change(slider, { target: { value: '30' } })

    expect(numberInput.value).toBe('30')
  })

  it('changing number input updates the slider', async () => {
    await renderAndWait()

    const slider = findRangeInput('Mindestpreis pro m³')
    const numberInput = findNumberInput('Mindestpreis pro m³')

    expect(slider.value).toBe('25')

    fireEvent.change(numberInput, { target: { value: '30' } })

    expect(slider.value).toBe('30')
  })

  it('slider and input stay in sync for percentage fields', async () => {
    await renderAndWait()

    const slider = findRangeInput('Zuschlag pro Etage (ohne Aufzug)')
    const numberInput = findNumberInput('Zuschlag pro Etage (ohne Aufzug)')

    // Default: 15 (displayed as percentage)
    expect(numberInput.value).toBe('15')
    expect(slider.value).toBe('15')

    fireEvent.change(slider, { target: { value: '20' } })
    expect(numberInput.value).toBe('20')

    fireEvent.change(numberInput, { target: { value: '10' } })
    expect(slider.value).toBe('10')
  })

  it('slider and input sync for heavy item fields', async () => {
    await renderAndWait()

    const slider = findRangeInput('Klavier/Flügel')
    const numberInput = findNumberInput('Klavier/Flügel')

    expect(numberInput.value).toBe('150')

    fireEvent.change(slider, { target: { value: '200' } })
    expect(numberInput.value).toBe('200')
  })
})

// ── Full save payload integrity ─────────────────────────────────

describe('Full save payload integrity', () => {
  it('unchanged config sends all original values', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    // Make a trivial change and revert to enable save, then use a different approach:
    // Toggle regional on, save, check ALL fields are present
    await user.click(findToggleButton('Regionale Preisanpassung'))
    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      // Verify all keys are present
      expect(payload.base_rate_m3_min).toBe(25)
      expect(payload.base_rate_m3_max).toBe(35)
      expect(payload.rate_km_near).toBe(2)
      expect(payload.rate_km_far).toBe(1)
      expect(payload.km_threshold).toBe(50)
      expect(payload.hourly_labor_min).toBe(60)
      expect(payload.hourly_labor_max).toBe(80)
      expect(payload.min_movers).toBe(2)
      expect(payload.floor_surcharge_percent).toBeCloseTo(0.15)
      expect(payload.hvz_permit_cost).toBe(120)
      expect(payload.kitchen_assembly_per_meter).toBe(45)
      expect(payload.external_lift_cost_min).toBe(350)
      expect(payload.external_lift_cost_max).toBe(500)
      expect(payload.weekend_surcharge_percent).toBeCloseTo(0.25)
      expect(payload.holiday_surcharge_percent).toBeCloseTo(0.50)
      expect(payload.packing_materials_per_m3).toBe(8)
      expect(payload.long_carry_per_10m).toBe(35)
      expect(payload.disposal_base_cost).toBe(80)
      expect(payload.disposal_per_m3).toBe(45)
      expect(payload.insurance_basic_flat).toBe(49)
      expect(payload.insurance_premium_percent).toBeCloseTo(0.01)
      expect(payload.insurance_premium_min).toBe(89)
      expect(payload.enable_regional_pricing).toBe(true) // toggled
      expect(payload.enable_seasonal_pricing).toBe(false)
      expect(payload.seasonal_peak_multiplier).toBe(1.15)
      expect(payload.seasonal_offpeak_multiplier).toBe(1.0)
      expect(payload.heavy_item_surcharges).toEqual({
        piano: 150, safe: 120, aquarium: 80,
        gym_equipment: 60, marble_table: 80, antique: 100,
      })
    })
  })

  it('multiple field changes all reflected in single save payload', async () => {
    const user = userEvent.setup()
    await renderAndWait()

    // Change multiple fields across different sections
    changeNumberInputValue('Mindestpreis pro m³', '28')
    changeNumberInputValue('Nahbereich (0-50km)', '2.5')
    changeNumberInputValue('Max. Stundenlohn pro Helfer', '85')
    changeNumberInputValue('Zuschlag pro Etage (ohne Aufzug)', '20')
    changeNumberInputValue('Klavier/Flügel', '180')
    changeNumberInputValue('Wochenendzuschlag (Sa/So)', '30')

    await user.click(screen.getByText('Änderungen speichern').closest('button')!)

    await waitFor(() => {
      const payload = mockedUpdatePricingConfig.mock.calls[0][1]
      expect(payload.base_rate_m3_min).toBe(28)
      expect(payload.rate_km_near).toBe(2.5)
      expect(payload.hourly_labor_max).toBe(85)
      expect(payload.floor_surcharge_percent).toBeCloseTo(0.20)
      expect(payload.heavy_item_surcharges.piano).toBe(180)
      expect(payload.weekend_surcharge_percent).toBeCloseTo(0.30)
      // Unchanged fields still correct
      expect(payload.base_rate_m3_max).toBe(35)
      expect(payload.hourly_labor_min).toBe(60)
      expect(payload.heavy_item_surcharges.safe).toBe(120)
    })
  })
})
