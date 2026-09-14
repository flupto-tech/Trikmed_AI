'use client'
import { hasPermission } from '../../config/roles'
import { getUser, getSession } from '../../utils/auth'

// Wrap any content to hide it from unauthorized roles.
// Usage: <RoleGuard permission="canManageStaff">...</RoleGuard>
// Optional fallback shown to unauthorized users.
export default function RoleGuard({ permission, fallback = null, children }) {
  // Merge user from both auth systems (API token takes precedence)
  const user = getUser() || getSession()
  if (!hasPermission(user, permission)) return fallback
  return children
}
