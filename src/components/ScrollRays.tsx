import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ScrollRaysProps {
  footerRef: React.RefObject<HTMLElement | null>;
  pageRef: React.RefObject<HTMLDivElement | null>;
}

export default function ScrollRays({ footerRef, pageRef }: ScrollRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const footer = footerRef.current;
    const container = containerRef.current;
    if (!footer || !container) return;

    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);

    const io = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        container.style.transform = `scaleY(${ratio})`;
      },
      { threshold: thresholds },
    );

    io.observe(footer);
    return () => io.disconnect();
  }, [footerRef, pageRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        transformOrigin: "bottom",
        transform: "scaleY(0)",
        display: "flex",
        alignItems: "flex-end",
        marginBottom: "-2vh",
        zIndex: 2,
        pointerEvents: "none",
        height: "65vh",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        opacity: resolvedTheme === "dark" ? 0.45 : 0.3,
        transition: "opacity 0.3s ease",
      }}
    >
      <svg
        style={{ width: "100%", height: "100%" }}
        viewBox="0 0 1271 599"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#sr-filter0)">
          <rect
            x="1287"
            y="614"
            width="174"
            height="323"
            transform="rotate(180 1287 614)"
            fill="url(#sr-paint0)"
          />
        </g>
        <g filter="url(#sr-filter1)">
          <rect
            x="1146"
            y="614"
            width="174"
            height="404"
            transform="rotate(180 1146 614)"
            fill="url(#sr-paint1)"
          />
        </g>
        <g filter="url(#sr-filter2)">
          <rect
            x="1005"
            y="614"
            width="174"
            height="478"
            transform="rotate(180 1005 614)"
            fill="url(#sr-paint2)"
          />
        </g>
        <g filter="url(#sr-filter3)">
          <rect
            width="174"
            height="323"
            transform="matrix(1 0 -5.78527e-07 -1 -16 614)"
            fill="url(#sr-paint3)"
          />
        </g>
        <g filter="url(#sr-filter4)">
          <rect
            width="174"
            height="404"
            transform="matrix(1 0 -6.17385e-07 -1 125 614)"
            fill="url(#sr-paint4)"
          />
        </g>
        <g filter="url(#sr-filter5)">
          <rect
            width="174"
            height="478"
            transform="matrix(1 0 -6.17385e-07 -1 266 614)"
            fill="url(#sr-paint5)"
          />
        </g>
        <g filter="url(#sr-filter6)">
          <rect
            width="175"
            height="530"
            transform="matrix(1 0 -6.17385e-07 -1 407 614)"
            fill="url(#sr-paint6)"
          />
        </g>
        <g filter="url(#sr-filter7)">
          <rect
            x="864"
            y="614"
            width="175"
            height="530"
            transform="rotate(180 864 614)"
            fill="url(#sr-paint7)"
          />
        </g>
        <g filter="url(#sr-filter8)">
          <rect
            width="173"
            height="584"
            transform="matrix(1 0 -6.17385e-07 -1 549 614)"
            fill="url(#sr-paint8)"
          />
        </g>
        <defs>
          <filter
            id="sr-filter0"
            x="1083"
            y="261"
            width="234"
            height="383"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter1"
            x="942"
            y="180"
            width="234"
            height="464"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter2"
            x="801"
            y="106"
            width="234"
            height="538"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter3"
            x="-46"
            y="261"
            width="234"
            height="383"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter4"
            x="95"
            y="180"
            width="234"
            height="464"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter5"
            x="236"
            y="106"
            width="234"
            height="538"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter6"
            x="377"
            y="54"
            width="235"
            height="590"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter7"
            x="659"
            y="54"
            width="235"
            height="590"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="sr-filter8"
            x="519"
            y="0"
            width="233"
            height="644"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
          </filter>
          <linearGradient
            id="sr-paint0"
            x1="1374"
            y1="614"
            x2="1374"
            y2="937"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint1"
            x1="1233"
            y1="614"
            x2="1233"
            y2="1018"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint2"
            x1="1092"
            y1="614"
            x2="1092"
            y2="1092"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint3"
            x1="87.0001"
            y1="0"
            x2="87.0001"
            y2="323"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint4"
            x1="87.0001"
            y1="0"
            x2="87.0001"
            y2="404"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint5"
            x1="87.0001"
            y1="0"
            x2="87.0001"
            y2="478"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint6"
            x1="87.5002"
            y1="0"
            x2="87.5002"
            y2="530"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint7"
            x1="951.5"
            y1="614"
            x2="951.5"
            y2="1144"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="sr-paint8"
            x1="86.5002"
            y1="0"
            x2="86.5002"
            y2="584"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#340B05" />
            <stop offset="0.182709" stopColor="#0358F7" />
            <stop offset="0.283673" stopColor="#5092C7" />
            <stop offset="0.413484" stopColor="#E1ECFE" />
            <stop offset="0.586565" stopColor="#FFD400" />
            <stop offset="0.682722" stopColor="#FA3D1D" />
            <stop offset="0.802892" stopColor="#FD02F5" />
            <stop offset="1" stopColor="#FFC0FD" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
