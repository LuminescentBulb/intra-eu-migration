export const MAP_STYLES = [
    {
        value: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        label: 'Dark Matter',
        color: '#3b4252',
    },
    {
        value: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        label: 'Positron',
        color: '#e2e8f0',
    },
];

export default function MapStyleSwitcher({
    mapStyle,
    setMapStyle,
    accentColor = 'blue',
}: {
    mapStyle: string;
    setMapStyle: (style: string) => void;
    accentColor?: 'blue' | 'emerald';
}) {
    const active = accentColor === 'emerald'
        ? 'border-emerald-400 shadow-md'
        : 'border-blue-400 shadow-md';
    const hover = accentColor === 'emerald'
        ? 'hover:border-emerald-300'
        : 'hover:border-blue-300';

    return (
        <div
            className="absolute top-4 left-4 z-20 flex flex-row gap-2 bg-gray-900 bg-opacity-90 rounded-full shadow-lg p-1 border border-gray-800"
            style={{ backdropFilter: 'blur(4px)' }}
        >
            {MAP_STYLES.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => setMapStyle(opt.value)}
                    title={opt.label}
                    aria-pressed={mapStyle === opt.value}
                    className={`flex items-center justify-center rounded-full border-2 transition-all h-10 w-10 bg-gray-900 ${mapStyle === opt.value ? active : `border-transparent ${hover}`}`}
                >
                    <span className="w-7 h-7 rounded block" style={{ background: opt.color }} />
                </button>
            ))}
        </div>
    );
}
