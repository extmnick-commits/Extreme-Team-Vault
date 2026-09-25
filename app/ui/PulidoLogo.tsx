import Image from 'next/image'

type PulidoLogoProps = {
  size?: number
  className?: string
  priority?: boolean
}

export default function PulidoLogo({
  size = 36,
  className = 'object-contain',
  priority = false,
}: PulidoLogoProps) {
  return (
    <Image
      src="/pulido-power-house-logo.jpg"
      alt="Extreme Team Vault"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  )
}
