# iStocked 📱💼
> **The Phone-Flipper's Ledger** — An offline-first, production-grade mobile inventory, sales, and analytics app built for second-hand device resellers and flippers.

[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat&logo=expo)](https://expo.dev/)
[![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61dafb?style=flat&logo=react)](https://reactnative.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![NativeWind v4](https://img.shields.io/badge/NativeWind-v4%20(Tailwind)-38bdf8?style=flat&logo=tailwindcss)](https://www.nativewind.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(Offline--First)-003b57?style=flat&logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Supabase](https://img.shields.io/badge/Cloud-Supabase%20(Sync%20%26%20Auth)-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)

---

## 📖 Overview

**iStocked** is tailored specifically for phone flippers, buy-and-sell entrepreneurs, and tech repair businesses. It eliminates messy spreadsheets and lost notes by providing a seamless, fast workflow to log bought devices, track repairs, scan IMEIs with instant model detection, record customer sales with warranties, and generate professional PDF receipts on the go.

It is designed to work **100% offline** using local SQLite storage, with automatic bidirectional background synchronization to **Supabase** when signed in with Google.

---

## ✨ Key Features

### 📦 Inventory Tracking & Specifications
- Track units across every stage: model, storage capacity, condition, color, battery health %, carrier/network lock, repair cost, purchase date, and accessories (Box, Charger, Cable, Receipt, Warranty Card).
- Dual-price tracking: purchase price vs. target list price for immediate margin visibility.
- Filter inventory by condition, network lock status, or stock availability.

### 📷 Smart Camera & Barcode Scanner
- High-speed IMEI and barcode scanning powered by `expo-camera`.
- **Automatic TAC Lookup**: Instantly identifies device make and model from the 15-digit IMEI Type Allocation Code.
- **Apple Part Number Lookup**: Decodes box model numbers into exact model, color, and storage configurations.
- Real-time duplicate check prevents re-adding existing stock.

### 💰 Flip Ledger & Financial Metrics
- **Executive Dashboard**: Real-time calculations of:
  - **Net Profit**: Accurate profit calculation factoring in purchase price and all repair/part expenses.
  - **Capital in Stock**: Total monetary investment currently sitting on shelf.
  - **Projected Profit**: Potential earnings if all active stock sells at list price.
- **Monthly Compiled Ledger**: Filterable sales history by month and year with average net margins and volume tracking.

### 🧾 Professional PDF Sales Receipts
- Generate clean, itemized sales receipts with buyer name, date, IMEI, warranty details, and prices.
- Native PDF printing and instant sharing via WhatsApp, Messenger, AirDrop, or local file save using `expo-print` and `expo-sharing`.

### 🛡️ Customer & Warranty Management
- Attach buyer contact details and warranty commitments (None, 7-Day, or 30-Day warranty).
- Easy refund workflow to revert transactions back to active inventory with a single tap.

### 🔌 Fully Offline-First + Cloud Backup
- Local SQLite database (`expo-sqlite`) in WAL (Write-Ahead Logging) mode guarantees instantaneous app responsiveness without network latency.
- Optional Google Sign-In via Supabase OAuth; automatically pushes edits, adds, and sales to cloud storage and syncs across devices.

### 📱 Tablet & Mobile Responsive Design
- Optimized for mobile handheld scanning and tablet landscape/portrait POS viewports with customized navigation and bottom sheet sizing.

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Framework** | [Expo SDK 57](https://expo.dev) | Managed Expo workflow with New Architecture support |
| **Runtime** | [React Native 0.86](https://reactnative.dev) | Native mobile runtime for Android & iOS |
| **Routing** | [Expo Router v57](https://docs.expo.dev/router/introduction/) | File-based typed routing with tab navigation |
| **Styling** | [NativeWind v4](https://www.nativewind.dev) / [Tailwind CSS 3.4](https://tailwindcss.com) | Semantic design tokens and responsive utility classes |
| **Typography** | `@expo-google-fonts/poppins` | Poppins Regular, Medium, SemiBold, and Bold |
| **Local Storage** | `expo-sqlite` (WAL Mode) | Persistent, relational local database |
| **Server Cache** | `@tanstack/react-query v5` | Declarative asynchronous query and mutation caching |
| **Client State** | `zustand v5` | Lightweight client-only state management |
| **Cloud & Auth** | `@supabase/supabase-js v2` | Cloud persistence, Google OAuth, and two-way sync |
| **Hardware APIs** | `expo-camera`, `expo-print`, `expo-sharing` | Barcode scanning, PDF generation, and sharing |
| **EAS Services** | EAS Build & EAS Update | Cloud builds and Over-The-Air (OTA) updates |

---

## 📁 Project Structure

```
iStocked/
├── app/                        # Expo Router screen declarations
│   ├── _layout.tsx             # Root layout, font loader, and auth gate
│   ├── welcome.tsx             # Onboarding & sign-in screen
│   ├── settings.tsx            # Settings & cloud sync dashboard
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── _layout.tsx         # Custom floating tab bar
│   │   ├── index.tsx           # Dashboard & financial metrics
│   │   ├── inventory.tsx       # Stock list & search filters
│   │   ├── sales.tsx           # Monthly sales ledger & analytics
│   │   └── scan.tsx            # Camera scanner & IMEI lookup
│   ├── checkout/index.tsx      # Sale finalization checkout flow
│   └── inventory/[id].tsx      # Device detail & edit screen
├── components/
│   ├── ui/                     # Primitive design system components (Button, Card, FormField...)
│   ├── devices/                # Domain components (AddDeviceSheet, ScanResultCard...)
│   └── sales/                  # Sales components (RecordSaleSheet...)
├── hooks/                      # Custom React hooks (useInventory, useSales, useAuth...)
├── lib/                        # Business logic, DB, and cloud services
│   ├── db.ts                   # SQLite schema definitions & migrations
│   ├── inventory.ts            # Local inventory CRUD operations
│   ├── sales.ts                # Sales ledger queries & records
│   ├── sync.ts                 # SQLite ↔ Supabase bidirectional sync engine
│   ├── supabase.ts             # Supabase client singleton & auth adapters
│   └── lookup/                 # TAC and Apple part number registries
├── types/                      # TypeScript domain models and interfaces
├── utils/                      # Formatting helpers (formatPrice, isValidImei, formatDate)
├── assets/                     # App icons, splash screens, and images
├── app.json                    # Expo project configuration
└── tailwind.config.js          # NativeWind design token definitions
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on mobile or an Android/iOS emulator
- (Optional) [EAS CLI](https://docs.expo.dev/build/introduction/) (`npm install -g eas-cli`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bulsu-rggnzls/iStocked.git
   cd iStocked
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: `postinstall` runs `patch-package` automatically to apply critical vendor patches).*

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *(Note: Cloud sync will run in safe fallback/offline mode if environment variables are omitted).*

4. **Start the development server:**
   ```bash
   npx expo start -c
   ```
   - Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).
   - Press `a` for Android Emulator, `i` for iOS Simulator, or `w` for Web.

---

## ⚙️ Development Commands

| Command | Action |
|---|---|
| `npm run start` | Start the Expo Metro bundler |
| `npm run android` | Run on connected Android device/emulator |
| `npm run ios` | Run on connected iOS simulator |
| `npm run web` | Serve web export |
| `npm run lint` | Run ESLint check with zero warnings |
| `npx tsc --noEmit` | Validate TypeScript types |

---

## 🚀 Deployment & EAS Updates (OTA)

iStocked utilizes **EAS Update** for instant Over-The-Air JavaScript updates without requiring APK re-installations.

### Pushing an OTA Update
```bash
# Push update to preview APK installs
eas update --channel preview --message "Your update message"

# Push update to production channel
eas update --channel production --message "Production release"
```

### Building a New Standalone APK
```bash
# Preview build (Direct APK output for testing)
eas build -p android --profile preview

# Production bundle (AAB for Google Play Store)
eas build -p android --profile production
```

---

## 🎨 Design & Code Standards

This project adheres to strict frontend standards outlined in [FRONTEND_STANDARDS.md](./FRONTEND_STANDARDS.md):
- **Design Tokens**: All colors, margins, and typography must utilize semantic Tailwind classes (`text-text-on-surface`, `bg-bg-surface-secondary`, `border-border-subtle`, etc.).
- **Accessibility (a11y)**: Every `Pressable` must define `accessibilityRole`, descriptive `accessibilityLabel`, and `hitSlop={8}` for touch targets.
- **Type Safety**: Zero `any` types; all API/DB interfaces are strictly typed in `types/index.ts`.

---

## 📄 License

Private & Proprietary © iStocked. All rights reserved.

