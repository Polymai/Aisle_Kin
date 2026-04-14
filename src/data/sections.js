export const SECTION_OPTIONS = [
  { value: 'Produce', label: 'Produce' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'Deli', label: 'Deli' },
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Meat & Seafood', label: 'Meat & Seafood' },
  { value: 'Frozen', label: 'Frozen' },
  { value: 'Pantry', label: 'Pantry' },
  { value: 'Beverages', label: 'Beverages' },
  { value: 'Household', label: 'Household' },
  { value: 'Other', label: 'Other' }
];

export function normalizeSection(value) {
  return SECTION_OPTIONS.find((entry) => entry.value === value)?.value || 'Other';
}