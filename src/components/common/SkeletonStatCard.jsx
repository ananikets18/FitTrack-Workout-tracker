const SkeletonStatCard = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-24 mt-3"></div>
    </div>
  );
};

export default SkeletonStatCard;
