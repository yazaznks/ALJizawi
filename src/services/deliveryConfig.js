// Delivery configuration per Jordanian governorate
// Each entry has:
//   baseFee: the standard delivery fee in JOD
//   freeThreshold: if cart subtotal >= this amount, delivery is free (null = no free delivery offered)
export const DELIVERY_OFFERS = {
  'الزرقاء': { baseFee: 2, freeThreshold: 35 },
  'عمان': { baseFee: 4, freeThreshold: 50 },
  'إربد': { baseFee: 4, freeThreshold: 50 },
  'المفرق': { baseFee: 4, freeThreshold: 50 },
  'عجلون': { baseFee: 5, freeThreshold: 80 },
  'البلقاء': { baseFee: 5, freeThreshold: 80 },
  'جرش': { baseFee: 4, freeThreshold: 50 },
  'مأدبا': { baseFee: 4, freeThreshold: 50 },
  'الكرك': { baseFee: 10, freeThreshold: null },
  'الطفيلة': { baseFee: 20, freeThreshold: null },
  'معان': { baseFee: 20, freeThreshold: null },
  'العقبة': { baseFee: 25, freeThreshold: null },
};

// Ordered list of governorates for dropdowns
export const GOVERNORATES_ORDERED = [
  'الزرقاء',
  'عمان',
  'إربد',
  'المفرق',
  'جرش',
  'مأدبا',
  'البلقاء',
  'عجلون',
  'الكرك',
  'الطفيلة',
  'معان',
  'العقبة',
];

/**
 * Calculate the effective delivery fee for a given governorate and subtotal.
 *
 * @param {string} governorate - The governorate name (Arabic).
 * @param {number} subtotal - The cart subtotal (before delivery).
 * @returns {{ fee: number, isFree: boolean, freeThreshold: number|null, baseFee: number }}
 */
export const calculateDeliveryFee = (governorate, subtotal) => {
  if (!governorate || !DELIVERY_OFFERS[governorate]) {
    return { fee: 0, isFree: false, freeThreshold: null, baseFee: 0 };
  }

  const { baseFee, freeThreshold } = DELIVERY_OFFERS[governorate];

  // If there's a free threshold and subtotal meets or exceeds it → free delivery
  if (freeThreshold !== null && subtotal >= freeThreshold) {
    return { fee: 0, isFree: true, freeThreshold, baseFee };
  }

  return { fee: baseFee, isFree: false, freeThreshold, baseFee };
};

/**
 * Get the closest governorate where free delivery is achievable (for suggestion banners).
 * Returns the governorate with the lowest freeThreshold the user hasn't selected.
 */
export const getBestFreeDeliverySuggestion = (subtotal) => {
  let best = null;
  let bestThreshold = Infinity;

  for (const [gov, config] of Object.entries(DELIVERY_OFFERS)) {
    if (config.freeThreshold !== null) {
      const diff = config.freeThreshold - subtotal;
      if (diff > 0 && config.freeThreshold < bestThreshold) {
        bestThreshold = config.freeThreshold;
        best = { governorate: gov, threshold: config.freeThreshold, remaining: diff };
      }
    }
  }

  return best;
};