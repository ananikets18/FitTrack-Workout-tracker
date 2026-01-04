const Card = ({ 
  children, 
  className = '', 
  hover = false,
  onClick,
  gradient = false,
  elevated = false,
}) => {
  const baseStyles = 'bg-white rounded-xl transition-all duration-300 ease-out';
  
  const shadowStyles = elevated 
    ? 'shadow-lifted' 
    : 'shadow-card';
  
  const hoverStyles = hover 
    ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer active:scale-[0.98] active:shadow-card' 
    : '';
  
  const gradientStyles = gradient 
    ? 'bg-gradient-card backdrop-blur-sm border border-gray-100/50' 
    : 'border border-gray-100/80';
  
  const paddingStyles = 'p-5 sm:p-6';
  
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
