export type PriceValue = string | number | null | undefined;

export function getNumericPrice(value: PriceValue): number | null {
  if (value === null || value === undefined || value === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function formatProductPrice(value: PriceValue): string {
  const price = getNumericPrice(value);
  return price === null ? "Liên hệ" : `${price.toLocaleString("vi-VN")}đ`;
}
