// Shared currency formatters used across the app.

// "₹1,23,456"
export const inr = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

// "₹1.23 Cr" / "₹2.34 L": used in the plan dashboard.
export const compact = (n) => {
  const v = Math.round(n || 0);
  if (v >= 1e7) return "₹" + (v / 1e7).toFixed(2) + " Cr";
  if (v >= 1e5) return "₹" + (v / 1e5).toFixed(2) + " L";
  return inr(v);
};

// "₹1.2Cr" / "₹2.3L": tighter style used on the marketing landing page.
export const compactShort = (n) => {
  const v = Math.round(n || 0);
  if (v >= 1e7) return "₹" + (v / 1e7).toFixed(1) + "Cr";
  if (v >= 1e5) return "₹" + (v / 1e5).toFixed(1) + "L";
  return inr(v);
};
