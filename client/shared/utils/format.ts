const numberFormat = new Intl.NumberFormat('en-GB')

/** "26,512 shows", "1 show". */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${numberFormat.format(count)} ${count === 1 ? singular : plural}`
}
