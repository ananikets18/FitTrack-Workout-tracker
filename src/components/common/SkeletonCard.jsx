const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white rounded-xl p-4 shadow-card ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

const SkeletonStat = () => {
  return (
    <div className="animate-pulse bg-white rounded-xl p-4 shadow-card text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-200 mb-3"></div>
      <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
    </div>
  );
};

const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export { SkeletonCard, SkeletonStat, SkeletonList };
export default SkeletonCard;
