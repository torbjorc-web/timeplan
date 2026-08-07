import type { SkoleData } from '../types'

export interface PanelProps {
  data: SkoleData
  setData: (updater: (d: SkoleData) => SkoleData) => void
}
