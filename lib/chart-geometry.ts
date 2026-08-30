export type ChartValue = { time: number; close: number }

export function chartGeometry(points: ChartValue[], width: number, height: number, padding: number) {
  const values = points.map((point) => point.close)
  const min = Math.min(...values), max = Math.max(...values), range = max - min
  const round = (value: number) => Math.round(value * 100) / 100
  const xFor = (index: number) => round(padding + index / Math.max(1, points.length - 1) * (width - padding * 2))
  const yFor = (value: number) => round(range === 0 ? height / 2 : padding + (max - value) / range * (height - padding * 2))
  if (points.length < 2) return { line: "", area: "", yFor }
  const coordinates = points.map((point, index) => `${index ? "L" : "M"} ${xFor(index)} ${yFor(point.close)}`).join(" ")
  return { line: coordinates, area: `${coordinates} L ${xFor(points.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`, yFor }
}
