# Resilient In-App Wallet & Payment Lifecycle

A production-grade React Native & Expo application built for the **Senior React Native / Frontend Lead** evaluation, showcasing **payment resilience, optimistic state management, atomic rollbacks, idempotent transaction reconciliation, and zero Cumulative Layout Shift (CLS)**.

---

## 📱 Deliverables & Artifacts

- **Android Debug APK**: Generated and available at [`builds/resilient-wallet-debug.apk`](./builds/resilient-wallet-debug.apk) (built via Gradle).
- **Automated Test Suite**: 8 comprehensive Jest tests verifying all core criteria (`npm test`).
- **Zero CLS & Cross-Platform**: Runs natively on Android, iOS, and Web (`npm run web` / `npm run android` / `npm run ios`).
- **Interactive Diagnostics Ledger**: Built-in developer console inspecting real-time MMKV disk writes, idempotency UUIDs, and triggering crash reconciliation hooks.

---

## 🏛️ Architecture Note: App Store / Play Store Billing Policy & Isolation

### Why Direct Gateways (e.g. Razorpay/Stripe) are Prohibited for Consumable Digital Currencies

Under **Apple App Store Review Guideline 3.1.1 (In-App Purchase)** and **Google Play Billing Policy**:
1. **Digital Goods Consumption Within Apps**: Any digital content, virtual currencies (coins, tokens, gems), unlocked features, or consumables used inside the mobile app **must** exclusively use Apple StoreKit / Google Play In-App Billing.
2. **Anti-Steering & Policy Enforcement**: Integrating external direct payment gateways (like Razorpay, Stripe, or PayPal) to sell in-app coins inside an iOS or Android app directly violates store guidelines and results in **immediate rejection or app removal**.
3. **Exceptions for Direct Gateways**: Direct gateways are permitted **only** when goods are consumed *outside* the digital software binary, including:
   - **Physical Goods & Merchandise** (e.g., hoodies, physical event merch, food delivery).
   - **Real-World / Off-Platform Services** (e.g., physical event tickets, rideshares).

### How Our Architecture Cleanly Isolates These Two Billing Boundaries

To enforce strict boundary isolation and maintain anti-corruption layers, the codebase utilizes **Domain-Driven Design (DDD)** and **Dependency Inversion**:

```
                       ┌────────────────────────────────────────────────────────┐
                       │                   Application UI                       │
                       └───────────┬────────────────────────────────┬───────────┘
                                   │                                │
            ┌──────────────────────▼───────┐        ┌───────────────▼──────────────┐
            │   Screen 1: Digital Coin Store│        │   Screen 2: Direct Gateway   │
            │   (Consumable Virtual Coins) │        │   (Physical Merch & Passes)  │
            └──────────────┬───────────────┘        └───────────────┬──────────────┘
                           │                                        │
                           │ [StoreKit / Play Billing Boundary]     │ [Direct Payment Boundary]
                           ▼                                        ▼
            ┌──────────────────────────────┐        ┌──────────────────────────────┐
            │       MockIAPService         │        │      MockGatewayService      │
            │  - Generates Idempotency UUID│        │  - Standard Gateway Orders   │
            │  - Pre-persists to MMKV      │        │  - UPI / Cards / NetBanking  │
            │  - Native Biometric Sheet    │        │  - Webhook / Captured State  │
            └──────────────┬───────────────┘        └───────────────┬──────────────┘
                           │                                        │
                           └───────────────────┬────────────────────┘
                                               ▼
                                    ┌─────────────────────┐
                                    │  Authoritative DB   │
                                    │    Server Ledger    │
                                    └─────────────────────┘
```

1. **Strict Service Separation**:
   - [`src/services/iap/mockIAPService.ts`](./src/services/iap/mockIAPService.ts): Designated strictly for consumable coin packs. Enforces client-side UUID idempotency key pre-persistence, simulates native biometric sheets, and settles against the in-app purchase store receipt validator.
   - [`src/services/gateway/mockGatewayService.ts`](./src/services/gateway/mockGatewayService.ts): Designated strictly for physical merchandise (hoodies, insulated tumblers) and external physical event tickets. Emulates Razorpay UPI/Card checkout.
2. **State & Mutation Isolation**:
   - `useWalletStore` mutations (crediting/debiting in-game coins) are completely decoupled from external gateway orders. Physical orders never touch the internal coin ledger.
3. **Pre-Persistence Idempotency Protocol**:
   - Prior to making any network call, an immutable `TransactionRecord` with status `PENDING` and a cryptographically random UUID is flushed synchronously to local storage (`MMKV`).

---

## ⚡ Core Technical Features & Testable Scenarios

### 1. Happy Path Coin Purchase (Screen 1)
- 3 consumable coin packs:
  - **Starter Pouch**: 100 coins for $0.99
  - **Pro Stash** (Most Popular): 500 coins (+50 bonus) for $4.99
  - **Treasury Vault** (Best Value): 1200 coins (+250 bonus) for $9.99
- Simulates native StoreKit sheet with realistic 800ms–1500ms network latency.
- Generates client-side UUID idempotency key, transitions to `SETTLED`, and atomically credits coins.

### 2. Optimistic Coin Spend & 500 Error Atomic Rollback
- Action: **"Send Animated Gift (50 Coins)"**.
- **Phase 1 (Instant Optimistic UI)**:
  - Instantly deducts 50 coins from wallet balance in memory (`balance -= 50`).
  - Takes a pre-mutation snapshot of the previous balance.
  - Synchronously flushes the updated balance to disk (`storage.setNumber('wallet:balance', next)`).
  - Triggers a 60fps fluid UI spring burst animation (floating gift, emoji scale, `-50 COINS` badge).
- **Phase 2 (Failure Simulation & Atomic Rollback)**:
  - Screen features a **"Simulate 500 Server Failure"** toggle.
  - When enabled, the backend mock rejects the transaction after 600ms latency with `HTTP 500: Database lock acquisition timeout`.
  - The store catches the failure, restores the previous balance from the atomic snapshot, synchronously writes it to disk, and triggers a non-blocking floating error toast.

### 3. Interrupted Transaction & UUID Idempotent Reconciliation
- During any in-flight StoreKit checkout, a **"Kill App / Simulate Network Drop"** button can be triggered.
- **Interruption Behavior**:
  - The in-flight transaction is immediately flagged as `INTERRUPTED` in MMKV storage with its client UUID preserved.
- **Boot Recovery (`reconcilePendingTransactions`)**:
  - Automatically executes on app launch or via the diagnostics ledger.
  - Scans MMKV for transactions with `PENDING` or `INTERRUPTED` status.
  - Reconciles with the authoritative backend ledger: resolves in-flight purchases and applies uncredited coins.
  - **Zero Double-Crediting Guarantee**: Re-running reconciliation performs a clean no-op, ensuring balance is never credited twice.

### 4. Layout Stability (Zero Cumulative Layout Shift - CLS)
- Dynamic catalog loading simulates a 400ms network latency.
- Custom [`CoinCardSkeleton.tsx`](./src/components/CoinCardSkeleton.tsx) uses fixed container bounds (`height: 104px`, fixed margins, matching aspect ratio) and pulsing opacity.
- Replacing the skeleton with [`CoinCard.tsx`](./src/components/CoinCard.tsx) produces **0px layout shift**.

### 5. High-Performance Synchronous Storage Layer (MMKV Interface)
- [`src/services/storage/storage.ts`](./src/services/storage/storage.ts) provides synchronous reads and writes:
  - `storage.setNumber()`, `storage.getNumber()` execute synchronously without async promises, preventing UI thread stutter, micro-stutters, and race conditions.
  - Fully cross-platform: leverages synchronous storage on native, synchronous `localStorage` on Web, and in-memory cache in Node/Jest.

---

## 🧪 Automated Test Suite

Run the full automated test suite verifying all evaluation criteria:

```bash
npm test
```

### Test Coverage Highlights:
- `__tests__/wallet.test.ts`:
  - Instant optimistic deduction (-50 coins)
  - Atomic snapshot rollback on 500 server error
  - Synchronous storage state verification
  - Insufficient funds exception guard
- `__tests__/reconciliation.test.ts`:
  - Client-side UUID idempotency key pre-persistence
  - Network interruption tracking (`INTERRUPTED`)
  - Boot reconciliation resolving pending purchases
  - Verification of zero duplicate crediting upon second reconciliation
- `__tests__/iap.test.ts`:
  - StoreKit purchase simulation with bonus coins
  - Direct gateway boundary isolation for physical goods

---

## 🚀 Running the Project

### Prerequisites
- Node.js >= 18 (Tested on v22.15.1)
- npm >= 9

### 1. Install Dependencies
```bash
npm install
```

### 2. Run on Web (Instant Testing / Demo)
```bash
npm run web
```
Open [http://localhost:8081](http://localhost:8081) in Chrome or Safari.

### 3. Run on Android / iOS Simulator
```bash
npm run android   # launches on connected Android emulator/device
npm run ios       # launches on iOS simulator (requires macOS + Xcode)
```

### 4. Build or Install Android APK
A pre-built debug APK is ready at:
```bash
builds/resilient-wallet-debug.apk
```
Or rebuild from source at any time:
```bash
cd android && ./gradlew assembleDebug
```
The newly assembled APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🎬 1-Minute Screen Recording Walkthrough Guide

Follow these 3 simple steps to demonstrate all evaluation criteria:

### Scenario 1: Happy Path Coin Purchase
1. Launch the app. Notice the balance begins at **1,000 Coins**.
2. Tap on the **Pro Stash (500 Coins for $4.99)** card.
3. Observe the native StoreKit sheet modal displaying the pre-generated **Client-Side Idempotency UUID**.
4. Tap **"Double-Click / Pay with Face ID"**.
5. Wait ~1 second for StoreKit verification:
   - Green success toast appears: `Purchase Successful! Credited +550 coins to your wallet`.
   - Balance updates from **1,000 -> 1,550 Coins**.

### Scenario 2: Optimistic Coin Spend with 500 Error Rollback
1. Toggle the **"Simulate 500 Error"** switch in the top header (turns RED: `FAIL ACTIVE`).
2. Tap the purple **"Send Gift (-50 Coins)"** button.
3. Observe:
   - Balance **immediately drops from 1,550 to 1,500 Coins** without delay.
   - 60fps fluid gift burst animation (floating gift box + `-50 COINS` badge) launches.
4. After 600ms, the mock server returns a `500 Server Error`:
   - Balance **smoothly rolls back to 1,550 Coins**.
   - A non-blocking inline error toast appears: `Gift Failed (500 Server Error): Backend validation failed. 50 coins smoothly rolled back to 1550`.

### Scenario 3: Simulated Network Drop Recovery on Reload
1. Ensure the 500 toggle is turned OFF.
2. Tap on the **Treasury Vault (1,200 Coins for $9.99)** card.
3. Tap **"Double-Click / Pay with Face ID"**.
4. During the in-flight processing window, tap the red button: **"⚡ Kill App / Simulate Network Drop"**.
5. Notice:
   - Sheet closes and error toast displays: `Transaction preserved in MMKV as INTERRUPTED`.
   - Coins are not yet credited (balance remains unchanged).
6. Tap the **"Ledger"** button in the top right to open the **Diagnostics Drawer**.
   - Observe the transaction listed with status `INTERRUPTED` and its unique UUID.
7. Tap **"Execute reconcilePendingTransactions()"** (simulating app relaunch reconciliation).
8. Observe:
   - Transaction status transitions to `SETTLED`.
   - Coins (+1,450 coins) are safely credited to the wallet without dropping the purchase.
   - Tap reconcile again to prove **zero duplicate crediting**!

---

## 📂 Project Structure

```
├── App.tsx                          # App root with navigation tabs, header bar, & boot reconciliation
├── __tests__/                       # Automated test suite (Jest)
│   ├── wallet.test.ts               # Optimistic deduction & 500 rollback tests
│   ├── reconciliation.test.ts       # Idempotency & network drop recovery tests
│   └── iap.test.ts                  # StoreKit & gateway isolation tests
├── src/
│   ├── types/                       # Shared domain TypeScript interfaces
│   ├── services/
│   │   ├── storage/storage.ts       # Synchronous MMKV storage layer with reactive listeners
│   │   ├── backend/mockBackend.ts   # Authoritative server ledger & idempotency registry
│   │   ├── iap/mockIAPService.ts    # StoreKit / Play Billing simulation & UUID generation
│   │   └── gateway/mockGatewayService.ts # Razorpay direct payment gateway for physical goods
│   ├── store/
│   │   ├── useWalletStore.ts        # Zustand store: optimistic mutations & atomic rollbacks
│   │   ├── useTransactionStore.ts   # Zustand store: MMKV ledger & reconcilePendingTransactions()
│   │   └── useDevSettingsStore.ts   # Dev toggles for 500 error & latency
│   ├── components/
│   │   ├── HeaderWalletBar.tsx      # Real-time coin counter, gift action & 500 toggle
│   │   ├── CoinCard.tsx             # Zero-CLS consumable coin pack card
│   │   ├── CoinCardSkeleton.tsx     # Pulsing shimmer skeleton placeholder
│   │   ├── GatewayProductCard.tsx   # Physical merchandise card
│   │   ├── StoreKitSheet.tsx        # Apple/Google native sheet with drop network control
│   │   ├── RazorpaySheet.tsx        # Razorpay modal (UPI / Card / NetBanking)
│   │   ├── GiftAnimationOverlay.tsx # 60fps floating gift burst animation
│   │   ├── Toast.tsx                # Non-blocking floating status/error toast
│   │   └── DiagnosticsDrawer.tsx    # Live MMKV ledger & manual reconciliation trigger
│   └── screens/
│       ├── CoinStoreScreen.tsx      # Screen 1: Digital Coin Store (IAP)
│       └── DirectGatewayScreen.tsx  # Screen 2: Direct Gateway (Razorpay)
├── builds/
│   └── resilient-wallet-debug.apk   # Generated Android Debug APK
└── package.json
```
