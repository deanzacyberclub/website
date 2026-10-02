import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

export interface SignaturePadHandle {
  /** Returns a transparent-background PNG data URL, or null if empty. */
  toDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  height?: number;
  onChange?: (empty: boolean) => void;
}

/**
 * Minimal pointer-driven signature pad. No dependencies.
 * Draws in black so the exported PNG reads correctly on a printed form.
 */
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ height = 180, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const last = useRef<{ x: number; y: number } | null>(null);
    const [empty, setEmpty] = useState(true);

    const setupCanvas = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      // Preserve existing strokes across resize
      const snapshot = empty ? null : c.toDataURL();
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      if (snapshot) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = snapshot;
      }
    };

    useEffect(() => {
      setupCanvas();
      const onResize = () => setupCanvas();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drawing.current = true;
      last.current = pos(e);
      const ctx = e.currentTarget.getContext("2d")!;
      // Dot for taps
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();
      if (empty) {
        setEmpty(false);
        onChange?.(false);
      }
    };

    const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current || !last.current) return;
      e.preventDefault();
      const p = pos(e);
      const ctx = e.currentTarget.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
    };

    const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      drawing.current = false;
      last.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const clear = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.restore();
      setEmpty(true);
      onChange?.(true);
    };

    useImperativeHandle(ref, () => ({
      toDataURL: () => (empty ? null : canvasRef.current?.toDataURL("image/png") ?? null),
      clear,
      isEmpty: () => empty,
    }));

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ height, touchAction: "none" }}
          className="w-full bg-white border border-gray-300 dark:border-matrix/40 cursor-crosshair select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
          aria-label="Signature pad"
        />
        {empty && (
          <span className="pointer-events-none absolute left-3 top-3 text-xs font-terminal text-gray-400">
            &gt; sign here with finger, stylus or mouse
          </span>
        )}
        <span className="pointer-events-none absolute left-4 right-4 bottom-8 border-b border-dashed border-gray-300" />
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 bottom-2 text-xs font-terminal px-2 py-1 border border-gray-300 dark:border-matrix/40 bg-white text-gray-700 hover:bg-gray-100"
        >
          CLEAR
        </button>
      </div>
    );
  },
);

export default SignaturePad;
