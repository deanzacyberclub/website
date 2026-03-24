interface MonogramProps {
  name: string;
  className?: string;
  textClassName?: string;
}

function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Monogram({ name, className = "", textClassName = "text-xs" }: MonogramProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={`font-mono font-bold text-green-700 dark:text-matrix select-none leading-none ${textClassName}`}>
        {getMonogram(name)}
      </span>
    </div>
  );
}
