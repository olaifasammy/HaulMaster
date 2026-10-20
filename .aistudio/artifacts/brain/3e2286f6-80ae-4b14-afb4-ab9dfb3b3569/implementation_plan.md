# Commercial Heavy Truck & Trailer Dealership

A realistic commercial dealership and fleet configuration suite with deep vehicle customization (aerodynamics, retarders, tire compounds, sleeper cab amenities, livery), a standalone commercial trailer catalog with swappable cargo types, and flexible financing options.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been synthesized from your confirmed answers:

- **Confirmed Decision 1 (Trailer Architecture)**: Standalone commercial trailer fleet where trailers (Dry Van, Refrigerated Reefer, Heavy Lowboy, Hazmat ADR Tanker, Intermodal Chassis) are acquired, configured, and assigned to route dispatches.
- **Confirmed Decision 2 (Pre-Buy Customization)**: Deep modular vehicle configuration in the showroom, including tire compounds (Highway Eco, All-Weather, Severe Snow), retarder braking systems, aerodynamic cab skirting, luxury sleeper cab amenities (reducing driver fatigue), and fleet paint livery.
- **Confirmed Decision 3 (Capital Acquisition)**: Multi-channel purchasing supporting both outright Treasury Cash Acquisition and Instant Commercial Equipment Lease/Financing (custom down payment with daily facility payments).

---

## 1. Overview & Core Concept

### What It Does
Transforms the vehicle acquisition experience from a basic purchase screen into a full-scale commercial dealership showroom. Logistics managers can interactively spec heavy haulers and specialized cargo trailers before signing delivery manifests, tailoring vehicle dynamics to their trade corridors and cargo requirements.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   COMMERCIAL FLEET DEALERSHIP                         │
├───────────────────────────────────┬────────────────────────────────────┤
│   [ TRUCK SHOWROOM ]              │   [ TRAILER SHOWROOM ]             │
│   • Model Specs & Powertrain      │   • Cargo Classification           │
│   • Aero, Retarder & Sleeper Pkg  │   • Axle Count & Reefer Aux Units  │
│   • Tire Compound Selection       │   • Aero Side Skirts & Telematics  │
│   • Custom Fleet Paint Livery     │   • Intermodal & ADR Certifications│
├───────────────────────────────────┴────────────────────────────────────┤
│                    ACQUISITION & FINANCING BAY                         │
│   [ Direct Treasury Purchase ]  or  [ Commercial Equipment Lease ]     │
│   Delivery Hub Destination Selection & Fleet Deployment                │
└────────────────────────────────────────────────────────────────────────┘
```

### Target Audience & Persona
Fleet executives, operations managers, and transport planners who want granular control over vehicle specs, operational fuel efficiency, driver fatigue management, and equipment financing.

### Key Value Delivered
- **Strategic Fleet Tailoring**: High-incline routes benefit from auxiliary hydraulic retarders; long flat highway runs gain from aero skirting; winter corridors require snow compounds.
- **Dedicated Trailer Assets**: Perishable goods demand cold-chain reefers; hazardous chemicals require ADR tankers; oversize equipment needs reinforced lowboys.
- **Capital Flexibility**: Purchase with upfront capital or preserve working treasury with structured commercial lease facilities.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Dealership Tab ]
       │
       ├──► Switch between "Truck Showroom" & "Trailer Showroom"
       │
       ├──► Select Vehicle / Trailer Model & View High-Res Spec Card
       │
       ├──► Interactive Pre-Buy Customizer:
       │      ├── Toggle Aero Skirting (-12% drag, +$4,500)
       │      ├── Equip Engine Retarder (+braking stability, +$3,200)
       │      ├── Select Tire Compound (Highway Eco / All-Weather / Severe Snow)
       │      ├── Select Sleeper Amenity Tier (Standard Cab / Long-Haul Deluxe Suite)
       │      └── Choose Fleet Paint Livery (Titanium, Obsidian, Emerald, Amber)
       │
       ├──► Select Destination Depot Hub for Factory Delivery
       │
       ├──► Choose Payment Method: Outright Cash vs Instant 60-Day Commercial Lease
       │
       └──► Order Confirmation -> New VIN / Serial Generated -> Unit Parked at Hub
```

### Visual Identity & Theme
- **Color Tokens**: Dark slate foundation (`#090d16` and `bg-slate-900/90`) paired with industrial amber accents (`#f59e0b`), tech cyan indicators for telemetry (`#38bdf8`), and emerald positive balance figures (`#10b981`).
- **Typography**: `Plus Jakarta Sans` for clean, high-contrast labels and editorial copy; `JetBrains Mono` for dyno numbers, VINs, trailer serials, and dollar amounts.
- **Showroom Stage**: Studio vehicle hero showcase with responsive aspect ratio, interactive spec pills, and live price recalculation upon toggling optional equipment.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Standalone Trailers vs Fixed Truck-Trailer Combos
- **Chosen Approach**: Standalone trailers owned in company inventory and docked at regional logistics terminals.
- **Why**: Allows flexible dispatch matching (e.g. matching a Titan 540 HD with a Heavy Lowboy for machinery, or a Strada 460 with a Reefer for cold-chain vaccines).
- **Impact on Route Dispatching**: Dispatcher interface seamlessly supports pairing an available truck and a compatible trailer at the hub with freight contracts.

### Decision 2: Deep Customization State & Physics Impact
- **Chosen Approach**: Every option toggled in the pre-buy configurator directly affects live physics simulation:
  - Aero package reduces aerodynamic drag coefficient ($C_d$).
  - Retarder prevents brake fade and reduces brake wear on mountain descents.
  - Tire compound modifies surface friction and rolling resistance ($\mu_{\text{friction}}$ and $C_{\text{rr}}$).
  - Deluxe Sleeper Cab reduces driver fatigue accumulation by 25%.
- **Why**: Ensures customization options have real gameplay consequences rather than being merely cosmetic.

### Decision 3: Equipment Lease Financing
- **Chosen Approach**: In addition to outright cash purchases, players can acquire vehicles via a 20% down payment with the remaining 80% converted into a 60-day equipment lease facility with daily amortized payments.
- **Why**: Solves early-game capital bottlenecks while mirroring authentic commercial fleet acquisition practices.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APP ARCHITECTURE                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ GameState Context ]                                                │
│      ├── trucks: TruckInstance[] (now includes customizer options)     │
│      ├── trailers: TrailerInstance[] (new dedicated fleet store)       │
│      ├── trailerCatalog: TrailerModel[] (Dry Van, Reefer, Lowboy, ...) │
│      ├── loans: BankLoan[] (equipment lease agreements)                │
│      └── ledger: LedgerEntry[]                                         │
│                         │                                              │
│                         ▼                                              │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ FleetManager View                                              │   │
│   │   ├── Fleet Inventory Sub-Tabs: [ Trucks ] [ Trailers ]        │   │
│   │   └── Dealership Showroom:                                     │   │
│   │         ├── Mode Switch: [ Heavy Haulers ] [ Cargo Trailers ]  │   │
│   │         ├── Interactive 3D/Photo Spec Stage                    │   │
│   │         ├── Powertrain / Cargo Classification Dyno             │   │
│   │         ├── Pre-Buy Option Configurator                        │   │
│   │         │     (Aero, Retarder, Tires, Sleeper, Livery)         │   │
│   │         └── Financing Modal (Cash vs 60-Day Commercial Lease)  │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                         │                                              │
│                         ▼                                              │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ RouteDispatcherModal                                           │   │
│   │   └── Auto-pairs or selects compatible owned trailer for cargo │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model Additions

- **`TrailerModelId`**: `'dry-van-48'` | `'reefer-53'` | `'lowboy-heavy'` | `'adr-tanker'` | `'intermodal-chassis'`
- **`TrailerInstance`**:
  - `id`: Unique serial `trl-XXXX`
  - `modelId`: Trailer model key
  - `category`: Cargo compatibility tag
  - `currentHubId`: Terminal location
  - `status`: `'idle'` | `'en_route'` | `'maintenance'`
  - `hasAeroSkirts`: Auxiliary trailer side skirts (-6% drag)
  - `tireCompound`: Trailer axle compound
  - `reeferFuelLiters`: Auxiliary tank level for temperature-controlled freight
  - `assignedTruckId`: Paired vehicle or null
- **`TruckInstance` Enhancements**:
  - `sleeperPackage`: `'standard'` | `'deluxe_suite'`
  - `liveryColor`: Color styling code
  - `assignedTrailerId`: Currently hitched trailer unit

---

## 5. Verification & Acceptance Criteria
- **Dealership Toggle & Models**: Smooth switching between heavy commercial trucks (4 models) and commercial freight trailers (5 models) with rich spec telemetry.
- **Interactive Pre-Buy Configurator**: Real-time updates to vehicle pricing, curb weight, aerodynamic drag, and braking ratings as options are selected.
- **Financing Flexibility**: Both outright cash acquisition and 20% down equipment lease facilities successfully provision the vehicle, update ledger logs, and dock the unit at the chosen terminal hub.
- **Dispatch Integration**: The route dispatcher accounts for paired trailers or prompts available depot trailers for specialized shipments (e.g. cold-chain food or ADR chemicals).
- **Compilation & Validation**: Passes `compile_applet` and `lint_applet` with zero TypeScript warnings.
