# MoveMaster White-Label Guide

## Overview

MoveMaster supports full white-labeling, allowing moving companies to use the platform with their own branding, domain, and pricing.

## How It Works

### Multi-Tenancy Architecture

Each company is identified by:
1. **Subdomain**: `company-name.movemaster.de`
2. **Custom Domain**: `calculator.your-company.de` (with CNAME)
3. **Header**: `X-Company-Slug: company-name` (for API)

### Tenant Isolation

- Each company has separate branding
- Each company can set custom pricing
- Quotes are isolated per company
- Analytics are per-company

## Setup for New White-Label Partner

### 1. Create Company Record

```sql
INSERT INTO companies (id, name, slug, logo_url, pricing_config) VALUES (
  gen_random_uuid(),
  'Acme Moving Company',
  'acme',
  'https://cdn.example.com/acme-logo.png',
  '{
    "branding": {
      "primary_color": "#ff6600",
      "secondary_color": "#ff8833",
      "tagline": "Professional Moving Services",
      "support_email": "support@acme-moving.de",
      "support_phone": "+49 30 9876 5432",
      "address": "Hauptstraße 45, 10117 Berlin",
      "website": "https://acme-moving.de"
    },
    "pricing_overrides": {
      "base_rate_m3_min": 30.0,
      "base_rate_m3_max": 40.0,
      "rate_km_near": 2.5,
      "hvz_permit_cost": 150.0
    }
  }'
);
```

### 2. Configure Subdomain

**DNS Configuration:**
```
acme.movemaster.de  CNAME  movemaster.de
```

**Or Custom Domain:**
```
calculator.acme-moving.de  CNAME  movemaster.de
```

### 3. Test Access

```bash
# Via subdomain
curl https://acme.movemaster.de/api/v1/branding

# Via custom domain
curl https://calculator.acme-moving.de/api/v1/branding

# Via header
curl -H "X-Company-Slug: acme" https://movemaster.de/api/v1/branding
```

## Branding Configuration

### Available Branding Options

```typescript
interface Branding {
  company_name: string          // Display name
  logo_url: string             // URL to company logo
  primary_color: string        // Main brand color (hex)
  secondary_color: string      // Secondary color
  accent_color: string         // Accent/highlight color
  font_family: string          // Custom font (loaded via CDN)
  tagline: string              // Company tagline
  support_email: string        // Support email address
  support_phone: string        // Support phone number
  address: string              // Company address
  website: string              // Company website URL
}
```

### Example: Full Branding Override

```json
{
  "branding": {
    "primary_color": "#2c3e50",
    "secondary_color": "#3498db",
    "accent_color": "#e74c3c",
    "font_family": "Roboto, sans-serif",
    "tagline": "Stress-Free Moving Solutions",
    "support_email": "help@partner-moves.de",
    "support_phone": "+49 40 1234 5678",
    "address": "Mönckebergstraße 7, 20095 Hamburg",
    "website": "https://partner-moves.de"
  }
}
```

## Pricing Configuration

### Pricing Override Options

Partners can override any of these pricing parameters:

```json
{
  "pricing_overrides": {
    "base_rate_m3_min": 30.0,        // Min rate per m³ (€)
    "base_rate_m3_max": 40.0,        // Max rate per m³ (€)
    "rate_km_near": 2.5,             // Rate per km (first 50km)
    "rate_km_far": 1.2,              // Rate per km (beyond 50km)
    "hourly_labor_min": 65.0,        // Min hourly labor cost
    "hourly_labor_max": 85.0,        // Max hourly labor cost
    "floor_surcharge_percent": 0.20, // Floor surcharge (20%)
    "hvz_permit_cost": 150.0,        // HVZ permit cost
    "kitchen_assembly_per_meter": 50.0, // Kitchen assembly
    "external_lift_cost_min": 400.0,
    "external_lift_cost_max": 600.0
  }
}
```

### Updating Pricing

Via API:
```bash
curl -X PUT https://api.movemaster.de/api/v1/admin/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "company_slug": "acme",
    "pricing_config": {
      "pricing_overrides": {
        "base_rate_m3_min": 35.0
      }
    }
  }'
```

Via SQL:
```sql
UPDATE companies 
SET pricing_config = jsonb_set(
  pricing_config, 
  '{pricing_overrides,base_rate_m3_min}', 
  '35.0'
) 
WHERE slug = 'acme';
```

## Email Customization

### Template Variables

All email templates support these variables:
- `{company_name}` - Company name
- `{support_email}` - Support email
- `{support_phone}` - Support phone
- `{website}` - Company website

### Custom Email Templates

Partners can provide custom HTML templates:

```json
{
  "email_templates": {
    "quote_confirmation": "https://cdn.acme.com/email-templates/confirmation.html",
    "pdf_quote": "https://cdn.acme.com/email-templates/pdf.html",
    "follow_up": "https://cdn.acme.com/email-templates/followup.html"
  }
}
```

## Frontend Integration

### Automatic Branding Detection

The frontend automatically:
1. Detects subdomain/domain
2. Fetches branding via `/api/v1/branding`
3. Applies CSS variables
4. Updates page title and meta tags

### Manual Branding Application

```typescript
import { useBranding } from '@/hooks/useBranding'

function App() {
  const { branding, loading } = useBranding()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div style={{ 
      '--primary': branding.primary_color 
    }}>
      <h1>{branding.company_name}</h1>
      <p>{branding.tagline}</p>
    </div>
  )
}
```

## Analytics Per Tenant

Each company gets isolated analytics:

```bash
# Get analytics for specific company
GET /api/v1/admin/analytics?company_slug=acme

# Returns company-specific metrics:
# - Total quotes
# - Conversion rate
# - Average quote value
# - Revenue
```

## Security Considerations

### Tenant Isolation

- ✅ Quotes are filtered by `company_id`
- ✅ Analytics are per-company
- ✅ API keys are scoped to company
- ⚠️ Implement Row-Level Security (RLS) in Supabase

### RLS Policies (Supabase)

```sql
-- Quotes table RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their company's quotes"
  ON quotes FOR SELECT
  USING (company_id = current_setting('app.current_company_id')::uuid);

-- Set company context in API
SELECT set_config('app.current_company_id', 'uuid-here', true);
```

## Billing & Revenue Sharing

### Subscription Models

1. **Flat Fee**: €X/month per company
2. **Per-Quote**: €Y per submitted quote
3. **Revenue Share**: Z% of accepted quotes

### Tracking

```sql
-- Track usage per company
SELECT 
  c.name,
  COUNT(q.id) as total_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  SUM((q.min_price + q.max_price) / 2) as total_value
FROM companies c
LEFT JOIN quotes q ON q.company_id = c.id
WHERE q.created_at > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name;
```

## Migration from Moving Pilot

For companies switching from Moving Pilot:

1. Export existing customer data
2. Map fields to MoveMaster schema
3. Import via admin API
4. Set up custom branding
5. Configure pricing to match existing rates
6. Test calculator with sample quotes
7. Switch DNS/domain

## Support

For white-label partners:
- Technical support: dev@movemaster.de
- Sales/pricing: sales@movemaster.de
- Documentation: https://docs.movemaster.de

## Roadmap

**Q1 2024:**
- [ ] Custom email SMTP per company
- [ ] Webhook integrations
- [ ] API key management UI

**Q2 2024:**
- [ ] White-label mobile app
- [ ] Advanced analytics dashboard
- [ ] CRM integrations

**Q3 2024:**
- [ ] Multi-language support per company
- [ ] Payment gateway integration
- [ ] Calendar/booking system
