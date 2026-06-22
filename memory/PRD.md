# Retail Grocery POS — PRD

## Original Problem Statement
Build a complete retail grocery POS user interface resembling LS Retail POS / Retail Pro / Odoo POS Retail / legacy Windows POS systems used in minimarket, supermarket, and grocery stores. NOT a restaurant POS. NOT modern e-commerce. Real cashier workstation.

## User Choices (verbatim)
- React + JS + Tailwind + shadcn (stack: yes)
- Frontend-only with Dexie/IndexedDB (no backend)
- Bilingual (UI Indonesian primary), product names Indonesian
- Currency: IDR (e.g. 57.500)
- Login PIN: 1234

## Architecture
```
frontend/src/
├── components/
│   ├── pos/         (Header, ScanInput, TransactionGrid, CustomerPanel, ActionButtons, StatusBar)
│   └── modals/      (OpenShift, CloseShift, Payment, Return, PettyCash, ProductSearch, Pending, CustomerLookup, TransactionList)
├── pages/           (LoginPage, POSPage)
├── stores/          (authStore, shiftStore, posStore, syncStore — Zustand)
├── db/database.js   (Dexie schema + seed)
├── services/mockApi.js (REST/JWT abstraction over Dexie)
├── lib/format.js    (IDR / date helpers)
└── constants/testIds.js
```

Backend: untouched (default FastAPI + MongoDB template). POS is fully client-side.

## Core Requirements (implemented)
- [x] Cashier login (username + PIN) with seeded users
- [x] Open Shift / Close Shift modals with cash counting & summary
- [x] Header with store info, cashier info, big TOTAL display (56px blue panel)
- [x] Scan area with QTY input + barcode input + product description (auto-focus, Enter key)
- [x] Transaction DataGrid (8 columns + footer totals), inline disc% / disc-amount edit, dense rows
- [x] Customer & delivery panel (member lookup, take away / delivery / pickup)
- [x] F1–F12 action buttons + Alt+R/P/C secondary row, keyboard shortcuts bound
- [x] Payment modal: Cash, Debit, Credit, QRIS, E-Wallet, Split — change calc & quick-amount chips
- [x] Pending transactions (save / resume / delete)
- [x] Sales return mode with original-transaction lookup
- [x] Petty cash in/out per shift with history list
- [x] Shift close modal with expected vs actual cash & difference
- [x] Status bar: online/offline/sync-pending dot, last sync, session, shift, user, trx#
- [x] Offline-first Dexie DB: users, shifts, products, customers, transactions, transaction_items, returns, petty_cash, pending_transactions, sync_queue
- [x] Mock API/JWT layer (services/mockApi.js)
- [x] Sync indicator + manual F12 sync
- [x] Indonesian Rupiah formatting + IBM Plex Sans/Mono typography
- [x] Sharp-cornered, dense, classic-POS aesthetic (no purple gradients, no rounded cards)
- [x] Toast notifications via sonner
- [x] Routing (/login, /pos, fallback)

## Deferred / Backlog
- P1: Real FastAPI+MongoDB backend with sync queue flushing
- P1: Receipt printing preview / ESC-POS output
- P1: Product setup CRUD (F3 placeholder)
- P2: Member registration flow
- P2: Discount promo engine
- P2: Multi-outlet selector
- P2: Tax (PPN) toggle per item

## Implementation Date
2026-02 — initial MVP
