'use client'
import { can } from '../../utils/auth'

// Gate any UI element or route behind a feature permission.
// Usage:
//   <FeatureGuard feature="page_prescriptions">
//     <PrescriptionsPage />
//   </FeatureGuard>
//
//   <FeatureGuard feature="view_revenue" fallback={<span>••••</span>}>
//     <span>₹24,500</span>
//   </FeatureGuard>
export default function FeatureGuard({ feature, fallback = null, children }) {
  if (!can(feature)) return fallback
  return children
}
