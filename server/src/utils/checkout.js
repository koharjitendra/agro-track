import DeliveryConfig from '../models/DeliveryConfig.model.js';

/**
 * Ensure the default delivery config document exists in the database.
 * This is called once on server startup.
 */
export const ensureDeliveryConfig = async () => {
  const existing = await DeliveryConfig.findOne({ key: 'default' });
  if (!existing) {
    await DeliveryConfig.create({ key: 'default' });
    console.log('[CONFIG] Default delivery config seeded.');
  }
};

/**
 * Get the delivery config (creates default if missing).
 */
export const getDeliveryConfig = async () => {
  let cfg = await DeliveryConfig.findOne({ key: 'default' });
  if (!cfg) {
    cfg = await DeliveryConfig.create({ key: 'default' });
  }
  return cfg;
};

/**
 * Calculate shipping charge based on total weight and configured tiers.
 * @param {number} totalWeightKg
 * @param {Array} tiers - sorted delivery tier configs
 * @returns {number} charge
 */
export const calculateDeliveryCharge = (totalWeightKg, tiers) => {
  // Sort tiers by minWeight ascending
  const sorted = [...tiers].sort((a, b) => a.minWeight - b.minWeight);

  for (const tier of sorted) {
    const aboveMin = totalWeightKg > tier.minWeight || totalWeightKg === tier.minWeight;
    const belowMax = tier.maxWeight === null || totalWeightKg <= tier.maxWeight;
    if (aboveMin && belowMax) {
      return tier.charge;
    }
  }
  // Fallback: free
  return 0;
};

/**
 * Full server-side checkout calculation.
 * @param {Array} items - [{ finalPrice, quantity, totalWeight }]
 * @param {object} cfg - DeliveryConfig document
 * @returns {object} price breakdown
 */
export const calculateCheckout = (items, cfg) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + parseFloat((item.finalPrice * item.quantity).toFixed(2));
  }, 0);

  const discountAmount = items.reduce((sum, item) => {
    const originalTotal = (item.basePrice || item.finalPrice) * item.quantity;
    const finalTotal = item.finalPrice * item.quantity;
    return sum + parseFloat((originalTotal - finalTotal).toFixed(2));
  }, 0);

  const totalWeightKg = items.reduce((sum, item) => {
    // Weight in kg — if unit is kg use quantity, otherwise treat as 1 kg each
    const weightPerUnit = item.unit === 'kg' ? item.quantity : 1;
    return sum + weightPerUnit;
  }, 0);

  const deliveryCharge = calculateDeliveryCharge(totalWeightKg, cfg.deliveryTiers);
  const handlingCharge = cfg.handlingFee;

  const grandTotal = parseFloat(
    (subtotal - discountAmount + deliveryCharge + handlingCharge).toFixed(2)
  );

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    totalWeightKg: parseFloat(totalWeightKg.toFixed(3)),
    deliveryCharge,
    handlingCharge,
    grandTotal,
  };
};
