const Card = ({ 
  children, 
  className = '', 
  hover = false,
  onClick,
  gradient = false,
  elevated = false,
}) => {
  const baseStyles = 'bg-white dark:bg-gray-800 rounded-xl transition-all duration-300 ease-out';
  
  const shadowStyles = elevated 
    ? 'shadow-lifted dark:shadow-none' 
    : 'shadow-card dark:shadow-none';
  
  const hoverStyles = hover 
    ? 'hover:shadow-card-hover dark:hover:bg-gray-750 hover:-translate-y-1 cursor-pointer active:scale-[0.98] active:shadow-card' 
    : '';
  
  const gradientStyles = gradient 
    ? 'bg-gradient-card backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/50' 
    : 'border border-gray-100/80 dark:border-gray-700/80';
  
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
