import { mediumHaptic } from '../../utils/haptics';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  haptic = true,
  'aria-label': ariaLabel,
  ...props 
}) => {
  const handleClick = (e) => {
    if (!disabled && haptic) {
      mediumHaptic();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 touch-manipulation';
  
  const variants = {
    primary: 'bg-gradient-primary text-white shadow-soft hover:shadow-lifted active:shadow-soft',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-soft',
    danger: 'bg-gradient-danger text-white shadow-soft hover:shadow-lifted active:shadow-soft',
    success: 'bg-gradient-success text-white shadow-soft hover:shadow-lifted active:shadow-soft',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
