export interface PricingConfig {
  A4_MONOCHROME: number;
  A4_COLOUR: number;
  A3_MONOCHROME: number;
  A3_COLOUR: number;
}

export const defaultPricing: PricingConfig = {
  A4_MONOCHROME: 2.0, // ₹2 per page
  A4_COLOUR: 10.0,    // ₹10 per page
  A3_MONOCHROME: 5.0, // ₹5 per page
  A3_COLOUR: 20.0,    // ₹20 per page
};

export function calculatePrice(
  pages: number,
  copies: number,
  paperSize: 'A4' | 'A3',
  colourMode: 'MONOCHROME' | 'COLOUR'
): number {
  const rateKey = `${paperSize}_${colourMode}` as keyof PricingConfig;
  const rate = defaultPricing[rateKey] || 2.0;
  return rate * pages * copies;
}
