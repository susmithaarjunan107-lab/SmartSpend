export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  loading = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      disabled={props.disabled || loading}
    >
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
