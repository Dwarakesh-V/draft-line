import { useRef, useState, useEffect } from "react";

export default function ScribbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>(
    []
  );

  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // True pixel canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 450 });

  // CSS-only preview size (for flicker-free resize)
  const [previewSize, setPreviewSize] = useState({ width: 600, height: 450 });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Base layer ImageData for instant stroke redraw
  const baseLayerRef = useRef<ImageData | null>(null);

  // ----------------------------------------------------
  // REAL CANVAS RESIZE (ONLY after user stops dragging)
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = 3;
    canvas.width = canvasSize.width * scale;
    canvas.height = canvasSize.height * scale;

    // Only CSS sizing is previewSize
    canvas.style.width = `${previewSize.width}px`;
    canvas.style.height = `${previewSize.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#000";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Restore the actual drawing if possible
    if (historyStep >= 0 && history[historyStep]) {
      restore(history[historyStep]);
    } else {
      saveState();
    }
  }, [canvasSize]);

  // ----------------------------------------------------
  // SAVE STATE (PNG) + UPDATE BASE LAYER
  // ----------------------------------------------------
  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const dataUrl = canvas.toDataURL("image/png");

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    // Update fast baseline
    baseLayerRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  // ----------------------------------------------------
  // RESTORE WITHOUT SCALING CONTENT
  // ----------------------------------------------------
  const restore = (url: string) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const img = new Image();
    img.src = url;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw exactly at original pixel resolution (no scale)
      ctx.drawImage(img, 0, 0);

      baseLayerRef.current = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
    };
  };

  // ----------------------------------------------------
  // DRAWING
  // ----------------------------------------------------
  const startDrawing = (e: React.MouseEvent) => {
    if (isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;

    setCurrentStroke([{ x, y }]);
    setIsDrawing(true);
  };

  const drawSmoothStroke = (
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[]
  ) => {
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;

      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }

    ctx.stroke();
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || isResizing) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;

    const updated = [...currentStroke, { x, y }];
    setCurrentStroke(updated);

    // Instant redraw from ImageData
    if (baseLayerRef.current) ctx.putImageData(baseLayerRef.current, 0, 0);

    drawSmoothStroke(ctx, updated);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const ctx = ctxRef.current;
    if (!ctx) return;

    drawSmoothStroke(ctx, currentStroke);
    saveState();

    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // ----------------------------------------------------
  // UNDO / REDO
  // ----------------------------------------------------
  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      restore(history[newStep]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      restore(history[newStep]);
    }
  };

  // ----------------------------------------------------
  // CLEAR
  // ----------------------------------------------------
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  // ----------------------------------------------------
  // FLICKER-FREE RESIZING (CSS ONLY DURING DRAG)
  // ----------------------------------------------------
  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      const newW = Math.max(400, resizeStart.width + dx);
      const newH = Math.max(300, resizeStart.height + dy);

      // No redraw — CSS only
      setPreviewSize({ width: newW, height: newH });
    };

    const onUp = () => {
      setIsResizing(false);

      // Commit real canvas resize ONCE
      setCanvasSize({ ...previewSize });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, resizeStart, previewSize]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);

    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: previewSize.width,
      height: previewSize.height,
    });
  };

  // ----------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ----------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      if (e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "C" && e.shiftKey) {
        e.preventDefault();
        clearCanvas();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [historyStep, history]);

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: previewSize.width,
          height: previewSize.height,
          background: "#fafafa",
          border: "1px solid #ccc",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{
            width: canvasSize.width,      // fixed
            height: canvasSize.height,    // fixed
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: isResizing ? "none" : "auto",
          }}
        />

        {/* resize handle */}
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "12px",
            height: "12px",
            cursor: "nwse-resize",
            opacity: 0.7,
            backgroundImage: `
        repeating-linear-gradient(
          135deg,
          #000 0,
          #000 1px,
          transparent 1px,
          transparent 4.2px
        )
      `,
            WebkitMaskImage: "linear-gradient(135deg, transparent 50%, black 50%)",
            maskImage: "linear-gradient(135deg, transparent 50%, black 50%)",
          }}
        />
      </div>

    </div>
  );
}
