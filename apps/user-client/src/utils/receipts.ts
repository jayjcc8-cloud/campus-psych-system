const receiptStorageKey = "support_receipts";

export interface LocalReceipt {
  receiptCode: string;
  requestId: string;
  createdAt: string;
}

export function listLocalReceipts(): LocalReceipt[] {
  const stored = uni.getStorageSync(receiptStorageKey);
  return Array.isArray(stored) ? stored : [];
}

export function saveLocalReceipt(receipt: LocalReceipt) {
  const next = [receipt, ...listLocalReceipts().filter((item) => item.receiptCode !== receipt.receiptCode)].slice(0, 20);
  uni.setStorageSync(receiptStorageKey, next);
}
