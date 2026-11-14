export default function Logo({ size = 40, className = '', alt = 'KhaanaKya', style, ...props }) {
  const dimension = typeof size === 'number' ? `${size}px` : size
  return (
    <img
      src="/logo.svg"
      alt={alt}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      className={`brand-logo ${className}`.trim()}
      style={{
        width: dimension,
        height: dimension,
        ...style,
      }}
      {...props}
    />
  )
}

