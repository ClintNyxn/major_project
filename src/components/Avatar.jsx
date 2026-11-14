import { useState } from 'react'
import { useApp } from '../context/useApp.js'
import { useAuth } from '../context/useAuth.js'

export default function Avatar({
  user,
  size = 36,
  className = '',
  alt = '',
  style,
  ...props
}) {
  const app = useApp()
  const auth = useAuth()

  const contextProfile = app?.profile || {}
  const contextUser = auth?.user || null

  // Priority: explicit prop > context profile > auth user metadata
  const avatarUrl =
    user?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    (!user ? contextProfile.avatar_url || contextUser?.user_metadata?.avatar_url : '') ||
    ''

  const displayName =
    user?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    (!user ? contextProfile.name || contextUser?.user_metadata?.full_name || contextUser?.email : '') ||
    ''

  const initial = (displayName.trim().charAt(0) || 'K').toUpperCase()

  // Track the URL that failed to load; when avatarUrl changes, hasError naturally resets
  const [failedUrl, setFailedUrl] = useState(null)
  const hasError = Boolean(avatarUrl && failedUrl === avatarUrl)

  const dimension = typeof size === 'number' ? `${size}px` : size

  if (avatarUrl && !hasError) {
    return (
      <img
        key={avatarUrl}
        src={avatarUrl}
        alt={alt || `${displayName || 'User'} avatar`}
        className={`app-avatar-img ${className}`.trim()}
        style={{
          width: dimension,
          height: dimension,
          minWidth: dimension,
          minHeight: dimension,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
        onError={() => setFailedUrl(avatarUrl)}
        {...props}
      />
    )
  }

  return (
    <span
      className={`app-avatar-initial ${className}`.trim()}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        fontSize: typeof size === 'number' ? `${Math.max(12, Math.round(size * 0.42))}px` : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {initial}
    </span>
  )
}
