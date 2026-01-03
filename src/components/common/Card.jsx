const Card = ({ 
  children, 
  className = '', 
  hover = false,
  onClick 
}) => {
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '';
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-5 transition-all duration-200 ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
