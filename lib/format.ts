export const formatPrice = (value: number | string) =>
  `$${Number(value).toFixed(2)}`;

export const formatImei = (imei: string) =>
  imei.replace(/(\d{5})(?=\d)/g, "$1 ").trim();

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });