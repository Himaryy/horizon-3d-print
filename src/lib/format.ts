export function formatIDR(amount: number) {
  return 'Rp\u00a0' + amount.toLocaleString('id-ID')
}
