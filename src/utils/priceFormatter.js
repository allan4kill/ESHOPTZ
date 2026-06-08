export function formatPrice(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return new Intl.NumberFormat('en-US').format(number)
}
