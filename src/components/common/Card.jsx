const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  gradient = false,
  elevated = false,
}) => {
  const baseStyles = 'bg-white rounded-2xl transition-all duration-300 ease-out';

  const shadowStyles = 'shadow-soft';

  const hoverStyles = hover
    ? 'hover:shadow-lifted hover:-translate-y-1 cursor-pointer active:scale-[0.98] active:shadow-soft'
    : '';

  const gradientStyles = gradient
    ? 'bg-gradient-card backdrop-blur-sm border border-gray-100/50 '
    : 'border border-gray-100/80 ';

  const paddingStyles = 'p-6 sm:p-7';

  return (
    <div
      className={`${baseStyles} ${shadowStyles} ${hoverStyles} ${gradientStyles} ${paddingStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

