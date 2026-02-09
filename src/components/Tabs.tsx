import { useState, useRef, useEffect } from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeButton = tabRefs.current[activeIndex];

    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div
      className={`relative flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 border border-gray-200 dark:border-gray-800 ${className}`}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-blue-100 dark:bg-gray-800 transition-all duration-300 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {/* Tab buttons */}
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => (tabRefs.current[index] = el)}
          onClick={() => onTabChange(tab.id)}
          className={`relative z-10 px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "text-blue-600 dark:text-matrix"
              : "text-gray-600 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
