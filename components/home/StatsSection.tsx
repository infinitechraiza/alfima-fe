const STATS = [
  { value: '500+', label: 'Properties Listed' },
  { value: '90+', label: 'Expert Agents' },
  { value: '100+', label: 'Happy Customers' },
  { value: '24/7', label: 'Support Available' },
];

export function StatsSection() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-[#dc143c] border border-[#dc143c] p-8 rounded-2xl text-center hover:shadow-lg transition">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-3">
                {stat.value}
              </div>
              <p className="text-white/90 text-lg font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
