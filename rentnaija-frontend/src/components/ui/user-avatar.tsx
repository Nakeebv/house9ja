import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'

interface UserAvatarProps {
  src?: string | null
  name: string
  size?: number
  isVerified?: boolean
  gradient?: string
  className?: string
}

const DEFAULT_GRADIENT = 'from-slate-500 to-slate-700'

export function UserAvatar({
  src,
  name,
  size = 40,
  isVerified = false,
  gradient = DEFAULT_GRADIENT,
  className = '',
}: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const badgeSize = Math.max(14, Math.round(size * 0.35))
  const badgeOffset = Math.round(size * 0.03)

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="overflow-hidden rounded-full w-full h-full"
        style={{ width: size, height: size }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} font-bold text-white`}
            style={{ fontSize: Math.max(10, Math.round(size * 0.36)) }}
          >
            {initials}
          </div>
        )}
      </div>

      {isVerified && (
        <span
          className="absolute flex items-center justify-center rounded-full bg-blue-600 ring-2 ring-white"
          style={{
            width: badgeSize,
            height: badgeSize,
            bottom: badgeOffset,
            right: badgeOffset,
          }}
          title="Verified by House9ja"
        >
          <BadgeCheck
            className="text-white"
            style={{ width: badgeSize * 0.75, height: badgeSize * 0.75 }}
            strokeWidth={2.5}
          />
        </span>
      )}
    </div>
  )
}
