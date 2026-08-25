const Loading = ({ label = "Loading..." }) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
    </div>
  );
};

export default Loading;
