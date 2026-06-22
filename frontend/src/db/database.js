import Dexie from 'dexie';

export const db = new Dexie('retail_pos_db');

db.version(1).stores({
  users: 'id, username',
  shifts: 'id, cashierId, status, openTime',
  products: 'id, barcode, name, category',
  customers: 'id, memberNumber, phone, name',
  transactions: 'id, trxNumber, shiftId, status, createdAt',
  transaction_items: 'id, transactionId',
  returns: 'id, originalTrxId, createdAt',
  petty_cash: 'id, shiftId, type, createdAt',
  pending_transactions: 'id, trxNumber, createdAt',
  sync_queue: '++id, entity, op, createdAt',
});

const seedProducts = [
  { barcode: '8991234567890', name: 'AMPLOP PAPERLINE PUTIH PJG BOX', unit: 'BOX', price: 57500, category: 'STATIONERY', stock: 24 },
  { barcode: '8991111000011', name: 'INDOMIE GORENG ORIGINAL 85G', unit: 'PCS', price: 3500, category: 'MIE INSTAN', stock: 240 },
  { barcode: '8991111000028', name: 'INDOMIE AYAM BAWANG 70G', unit: 'PCS', price: 3200, category: 'MIE INSTAN', stock: 180 },
  { barcode: '8992222000035', name: 'AQUA AIR MINERAL 600ML', unit: 'BTL', price: 3500, category: 'MINUMAN', stock: 320 },
  { barcode: '8992222000042', name: 'AQUA AIR MINERAL 1500ML', unit: 'BTL', price: 5500, category: 'MINUMAN', stock: 150 },
  { barcode: '8993333000059', name: 'TEH BOTOL SOSRO KOTAK 250ML', unit: 'PCS', price: 4000, category: 'MINUMAN', stock: 88 },
  { barcode: '8994444000066', name: 'BERAS RAMOS PREMIUM 5KG', unit: 'SAK', price: 72500, category: 'SEMBAKO', stock: 30 },
  { barcode: '8994444000073', name: 'BERAS PANDAN WANGI 5KG', unit: 'SAK', price: 78000, category: 'SEMBAKO', stock: 22 },
  { barcode: '8995555000080', name: 'MINYAK GORENG BIMOLI 2L', unit: 'BTL', price: 38500, category: 'SEMBAKO', stock: 60 },
  { barcode: '8995555000097', name: 'GULA PASIR GULAKU 1KG', unit: 'PACK', price: 16500, category: 'SEMBAKO', stock: 75 },
  { barcode: '8996666000103', name: 'KOPI KAPAL API SPECIAL 165G', unit: 'PCS', price: 12500, category: 'KOPI TEH', stock: 60 },
  { barcode: '8996666000110', name: 'KOPI ABC SUSU 5x30G', unit: 'RNCG', price: 5500, category: 'KOPI TEH', stock: 110 },
  { barcode: '8997777000127', name: 'SUSU UHT ULTRA COKLAT 250ML', unit: 'PCS', price: 6500, category: 'SUSU', stock: 90 },
  { barcode: '8997777000134', name: 'SUSU KENTAL MANIS FRISIAN 370G', unit: 'KLG', price: 14500, category: 'SUSU', stock: 45 },
  { barcode: '8998888000141', name: 'ROTI TAWAR SARI ROTI 380G', unit: 'PCS', price: 17500, category: 'ROTI', stock: 18 },
  { barcode: '8999999000158', name: 'SABUN MANDI LIFEBUOY 85G', unit: 'PCS', price: 4500, category: 'TOILETRIES', stock: 200 },
  { barcode: '8999999000165', name: 'PASTA GIGI PEPSODENT 190G', unit: 'PCS', price: 16500, category: 'TOILETRIES', stock: 75 },
  { barcode: '8999999000172', name: 'SHAMPOO CLEAR MEN 170ML', unit: 'BTL', price: 32500, category: 'TOILETRIES', stock: 40 },
  { barcode: '8990000000189', name: 'DETERGEN RINSO ANTI NODA 770G', unit: 'PACK', price: 24500, category: 'HOUSEHOLD', stock: 65 },
  { barcode: '8990000000196', name: 'PEMBERSIH LANTAI WIPOL 800ML', unit: 'BTL', price: 14000, category: 'HOUSEHOLD', stock: 50 },
  { barcode: '8990000000202', name: 'TISSUE PASEO 250 SHEETS', unit: 'PACK', price: 18500, category: 'HOUSEHOLD', stock: 80 },
  { barcode: '8990000000219', name: 'CHITATO RASA SAPI PANGGANG 68G', unit: 'PCS', price: 9500, category: 'SNACK', stock: 95 },
  { barcode: '8990000000226', name: 'BENG BENG CHOCOLATE 20G', unit: 'PCS', price: 2500, category: 'SNACK', stock: 250 },
  { barcode: '8990000000233', name: 'OREO ORIGINAL 137G', unit: 'PACK', price: 9500, category: 'SNACK', stock: 100 },
  { barcode: '8990000000240', name: 'ROKOK SAMPOERNA MILD 16', unit: 'BKS', price: 32500, category: 'ROKOK', stock: 200 },
];

const seedCustomers = [
  { memberNumber: 'M-0001', name: 'BUDI SANTOSO', phone: '081234567890', address: 'JL. MERDEKA NO. 12, JAKARTA' },
  { memberNumber: 'M-0002', name: 'SITI AMINAH', phone: '082198765432', address: 'JL. SUDIRMAN NO. 45, BANDUNG' },
  { memberNumber: 'M-0003', name: 'AGUS WIJAYA', phone: '081345678912', address: 'JL. PAHLAWAN NO. 7, SURABAYA' },
  { memberNumber: 'M-0004', name: 'DEWI LESTARI', phone: '081567894321', address: 'JL. DIPONEGORO 23, YOGYAKARTA' },
];

const seedUsers = [
  { id: 'u-001', username: 'cashier', pin: '1234', name: 'Andi Pratama', role: 'CASHIER' },
  { id: 'u-002', username: 'manager', pin: '9999', name: 'Rina Halim', role: 'MANAGER' },
];

export async function seedIfEmpty() {
  await db.transaction('rw', db.users, db.products, db.customers, async () => {
    const userCount = await db.users.count();
    if (userCount === 0) {
      await db.users.bulkAdd(seedUsers);
    }
    const pCount = await db.products.count();
    if (pCount === 0) {
      const withId = seedProducts.map((p, i) => ({ id: `p-${(i + 1).toString().padStart(4, '0')}`, ...p }));
      await db.products.bulkAdd(withId);
    }
    const cCount = await db.customers.count();
    if (cCount === 0) {
      const withId = seedCustomers.map((c, i) => ({ id: `c-${(i + 1).toString().padStart(4, '0')}`, ...c }));
      await db.customers.bulkAdd(withId);
    }
  }).catch(() => {});
}
