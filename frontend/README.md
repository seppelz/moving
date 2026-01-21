# MoveMaster Frontend

React + TypeScript + Vite frontend for MoveMaster moving calculator.

## Features

- ⚡ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Latest React with TypeScript
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🎭 **Framer Motion** - Smooth animations
- 🐻 **Zustand** - Lightweight state management
- 📝 **React Hook Form** - Performant forms
- 🌐 **Axios** - HTTP client
- 🎯 **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   └── calculator/     # Calculator-specific components
├── pages/              # Page components
│   └── admin/          # Admin pages
├── hooks/              # Custom React hooks
├── services/           # API clients
├── store/              # Zustand stores
├── types/              # TypeScript types
└── main.tsx           # Entry point
```

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

## Key Components

### Calculator Flow

1. **StepInstant** - Quick estimate (postal codes + apartment size)
2. **StepInventory** - Detailed item selection with room templates
3. **StepServices** - Additional services (HVZ, packing, etc.)
4. **StepContact** - Contact info and quote submission

### Admin Dashboard

- Analytics overview
- Quotes management
- Status updates
- Pricing configuration

## State Management

Uses Zustand for global state:

```typescript
import { useCalculatorStore } from '@/store/calculatorStore'

function Component() {
  const { inventory, addItem } = useCalculatorStore()
  // ...
}
```

## API Integration

All API calls go through `services/api.ts`:

```typescript
import { quoteAPI } from '@/services/api'

const quote = await quoteAPI.calculateQuote({
  origin_postal_code: '10115',
  destination_postal_code: '80331',
  apartment_size: '2br'
})
```

## Styling

### Tailwind Utilities

Custom utilities defined in `index.css`:

- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.input-field` - Form input
- `.card` - Card container

### Theme Colors

Primary color palette (can be overridden via white-label):

```javascript
primary: {
  50: '#f0f9ff',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
}
```

## White-Label Support

The app automatically loads company-specific branding:

```typescript
import { useBranding } from '@/hooks/useBranding'

const { branding } = useBranding()
// branding.primary_color, branding.company_name, etc.
```

CSS variables are automatically applied to `:root`.

## Analytics

Track user behavior:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

const { trackQuoteCalculated } = useAnalytics()

trackQuoteCalculated(minPrice, maxPrice, volume)
```

## Testing

```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

## Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

## Build for Production

```bash
npm run build
```

Output goes to `dist/` directory.

### Environment-Specific Builds

```bash
# Staging
VITE_API_URL=https://api-staging.movemaster.de npm run build

# Production
VITE_API_URL=https://api.movemaster.de npm run build
```

## Deployment

### Vercel (Recommended)

```bash
vercel
```

Or connect GitHub repo for auto-deployment.

### Manual Deployment

```bash
npm run build
# Upload dist/ to your web server
```

### Docker

```bash
docker build -t movemaster-frontend .
docker run -p 3000:3000 movemaster-frontend
```

## Performance

- Code splitting per route
- Lazy loading for heavy components
- Image optimization with next-gen formats
- CSS purging in production

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create feature branch
2. Make changes
3. Run linter and tests
4. Submit PR

## License

Proprietary
