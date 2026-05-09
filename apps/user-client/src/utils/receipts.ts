const receiptStorageKey = "support_receipts";

export interface LocalReceipt {
  kind: "support_request" | "assessment";
  receiptCode: string;
  itemId: string;
  title: string;
  createdAt: string;
}

export function listLocalReceipts(): LocalReceipt[] {
  const stored = uni.getStorageSync(receiptStorageKey);
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.map((item) => ({
    kind: item.kind === "assessment" ? "assessment" : "support_request",
    receiptCode: item.receiptCode,
    itemId: item.itemId ?? item.requestId ?? item.receiptCode,
    title: item.title ?? (item.kind === "assessment" ? "心理测评" : "预约记录"),
    createdAt: item.createdAt
  }));
}

export function saveLocalReceipt(receipt: LocalReceipt) {
  const next = [receipt, ...listLocalReceipts().filter((item) => item.receiptCode !== receipt.receiptCode)].slice(0, 20);
  uni.setStorageSync(receiptStorageKey, next);
}
