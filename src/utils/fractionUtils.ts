// Utility functions for medicine dosage and stock fraction calculations and clean display

export function roundFraction(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function formatFraction(num: number): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const rounded = roundFraction(num, 2);
  const integerPart = Math.floor(rounded);
  const fractionPart = roundFraction(rounded - integerPart, 2);

  let fractionStr = '';
  if (Math.abs(fractionPart - 0.5) < 0.01) {
    fractionStr = '½';
  } else if (Math.abs(fractionPart - 0.25) < 0.01) {
    fractionStr = '¼';
  } else if (Math.abs(fractionPart - 0.75) < 0.01) {
    fractionStr = '¾';
  } else if (Math.abs(fractionPart - 0.33) < 0.02) {
    fractionStr = '⅓';
  } else if (Math.abs(fractionPart - 0.67) < 0.02) {
    fractionStr = '⅔';
  } else if (fractionPart > 0) {
    fractionStr = fractionPart.toString().replace('0.', '.');
  }

  if (integerPart === 0 && fractionStr) {
    return fractionStr;
  }
  if (fractionStr) {
    return `${integerPart} ${fractionStr}`;
  }
  return integerPart.toString();
}

export const COMMON_FRACTION_DOSES = [
  { label: '¼ (0.25)', value: 0.25, badge: 'Quarter' },
  { label: '½ (0.5)', value: 0.5, badge: 'Half' },
  { label: '¾ (0.75)', value: 0.75, badge: 'Three-Quarter' },
  { label: '1 (Whole)', value: 1.0, badge: 'Standard' },
  { label: '1 ½ (1.5)', value: 1.5, badge: '1.5 Units' },
  { label: '2 (Double)', value: 2.0, badge: '2 Units' },
];
