const formatNumber = (value: number) => {
  const fixed = Number(value).toFixed(2);
  const [int, dec] = fixed.split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
};

export const formatPrice = (value: number | string) =>
  `₱${formatNumber(Number(value))}`;

export const formatImei = (imei: string) => {
  if (!imei || imei.startsWith("NO-IMEI")) return "No IMEI";
  return imei.replace(/(\d{5})(?=\d)/g, "$1 ").trim();
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });