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

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const isValidImei = (digits: string) => {
  if (!/^\d{15}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(digits[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
};