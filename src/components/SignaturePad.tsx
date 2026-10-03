import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface SignaturePadHandle {
  /** Transparent-background PNG data URL, or null if nothing was drawn. */
  toDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  height?: number;
  onChange?: (empty: boolean) => void;
}

/**
 * Pointer-driven signature pad, no dependencies. Finger, stylus and mouse.
 *
 * Strokes live only in the canvas bitmap, and setting canvas.width wipes it,
 * so layout changes are handled carefully: we re-layout only when the
 * element's CSS width actually changes (not on height-only changes such as
 * the mobile keyboard closing or the address bar collapsing), and we copy
 * the existing bitmap across synchronously when we do.
 */
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ height = 180, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const last = useRef<{ x: number; y: number } | null>(null);
    const emptyRef = useRef(true);
    const layoutWidth = useRef(0);
    const [empty, setEmpty] = useState(true);

    const markEmpty = (value: boolean) => {
      if (emptyRef.current === value) return;
      emptyRef.current = value;
      setEmpty(value);
      onChange?.(value);
    };

    const applyStrokeStyle = (ctx: CanvasRenderingContext2D) => {
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#000000";
    };

    /** (Re)size the bitmap to the element's CSS size, keeping existing strokes. */
    const layout = (force = false) => {
      const c = canvasRef.current;
      if (!c) return;
      const cssW = Math.round(c.getBoundingClientRect().width);
      if (cssW === 0) return;
      if (!force && cssW === layoutWidth.current) return;

      const dpr = window.devicePixelRatio || 1;
      // Keep a synchronous copy of the current bitmap.
      let copy: HTMLCanvasElement | null = null;
      if (!emptyRef.current && c.width > 0 && c.height > 0) {
        copy = document.createElement("canvas");
        copy.width = c.width;
        copy.height = c.height;
        copy.getContext("2d")!.drawImage(c, 0, 0);
      }

      layoutWidth.current = cssW;
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyStrokeStyle(ctx);
      if (copy) ctx.drawImage(copy, 0, 0, cssW, height);
    };

    useEffect(() => {
      layout(true);
      const c = canvasRef.current;
      if (!c) return;
      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => layout());
        ro.observe(c);
      } else {
        window.addEventListener("resize", () => layout());
      }
      return () => ro?.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height]);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      // Blur any focused input so the mobile keyboard closes BEFORE we start
      // drawing; the resulting layout shift then cannot wipe a stroke.
      if (document.activeElement instanceof HTMLElement && document.activeElement !== e.currentTarget) {
        document.activeElement.blur();
      }
      layout();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* unsupported */
      }
      drawing.current = true;
      last.current = pos(e);
      const ctx = e.currentTarget.getContext("2d")!;
      applyStrokeStyle(ctx);
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      ctx.fill();
      markEmpty(false);
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
        /* already released */
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
      markEmpty(true);
    };

    useImperativeHandle(ref, () => ({
      toDataURL: () =>
        emptyRef.current ? null : (canvasRef.current?.toDataURL("image/png") ?? null),
      clear,
      isEmpty: () => emptyRef.current,
    }));

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{
            height,
            touchAction: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
          className="w-full bg-white border border-gray-300 dark:border-matrix/40 cursor-crosshair select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onContextMenu={(e) => e.preventDefault()}
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
