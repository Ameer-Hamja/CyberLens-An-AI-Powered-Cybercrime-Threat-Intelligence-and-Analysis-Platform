export default function MapLegend() {
  const items = [
    { color: '#85b7eb', label: '1-5' },
    { color: '#e8c547', label: '6-20' },
    { color: '#ef9f27', label: '21-50' },
    { color: '#ef6b4a', label: '51-100' },
    { color: '#e24b4a', label: '100+' },
  ]
  return (
    <div className="absolute bottom-4 right-4 z-[1000] card px-3 py-2.5 space-y-1.5">
      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
        Threat Density
      </div>
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[11px] text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
