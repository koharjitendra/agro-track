import { create } from 'zustand';

/**
 * Cart store — persists in memory for the session.
 * Each cart item: { listingId, productName, farmerId, farmerName, pricePerUnit, unit, quantity, availableQuantity, location }
 */
export const useCartStore = create((set, get) => ({
  items: [],

  addToCart: (listing) => {
    const items = get().items;
    const existing = items.find((i) => i.listingId === listing._id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.listingId === listing._id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.availableQuantity) }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            listingId: listing._id,
            productName: listing.productName,
            farmerId: listing.farmerId?._id || listing.farmerId,
            farmerName: listing.farmerId?.name || 'Unknown',
            pricePerUnit: listing.price,
            unit: listing.unit || 'kg',
            quantity: 1,
            availableQuantity: listing.quantity,
            location: listing.location || '',
          },
        ],
      });
    }
  },

  removeFromCart: (listingId) => {
    set({ items: get().items.filter((i) => i.listingId !== listingId) });
  },

  updateQuantity: (listingId, qty) => {
    if (qty < 1) return;
    set({
      items: get().items.map((i) =>
        i.listingId === listingId
          ? { ...i, quantity: Math.min(qty, i.availableQuantity) }
          : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  cartTotal: () => get().items.reduce((sum, i) => sum + i.pricePerUnit * i.quantity, 0),

  cartCount: () => get().items.length,
}));
