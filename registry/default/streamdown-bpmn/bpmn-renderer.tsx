"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type Viewer from "bpmn-js/lib/Viewer";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  Maximize2Icon,
  RotateCcwIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import type { CustomRenderer, CustomRendererProps } from "streamdown";
import {
  hasRenderableBpmnDiagram,
  isBpmnComplete,
  mendBpmn,
} from "./bpmn-utils";

type BpmnViewbox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type BpmnCanvas = {
  resized: () => void;
  viewbox: (box?: BpmnViewbox) => BpmnViewbox;
  zoom: (value?: number | "fit-viewport") => number;
};

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const COPY_RESET_MS = 2000;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const ACTION_BUTTON_CLASS =
  "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const CONTROL_BUTTON_CLASS =
  "flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const BpmnLoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex items-center space-x-2 text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
      <span className="text-sm">Loading diagram...</span>
    </div>
  </div>
);

type BpmnViewportProps = {
  code: string;
  fullscreen?: boolean;
  streaming?: boolean;
  onViewerReady?: (viewer: Viewer | null) => void;
};

const BpmnViewport = ({
  code,
  fullscreen = false,
  streaming = false,
  onViewerReady,
}: BpmnViewportProps) => {
  const canvasRef = useRef<BpmnCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const enqueueImportRef = useRef<(nextCode: string) => void>(() => undefined);
  const hasRenderedRef = useRef(false);
  const onViewerReadyRef = useRef(onViewerReady);
  const userAdjustedViewportRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasRendered, setHasRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onViewerReadyRef.current = onViewerReady;
  }, [onViewerReady]);

  const resetView = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    userAdjustedViewportRef.current = false;
    canvas.resized();
    canvas.zoom("fit-viewport");
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    userAdjustedViewportRef.current = true;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, canvas.zoom() + delta));
    canvas.zoom(nextZoom);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let cancelled = false;
    let viewer: Viewer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeFrame = 0;
    let pendingCode: string | null = null;
    let importing = false;

    canvasRef.current = null;
    hasRenderedRef.current = false;
    userAdjustedViewportRef.current = false;

    const importPendingCode = async () => {
      if (cancelled || importing || !viewer) {
        return;
      }

      importing = true;

      while (!cancelled && viewer && pendingCode !== null) {
        const nextCode = pendingCode;
        pendingCode = null;
        const canvas = viewer.get<BpmnCanvas>("canvas");
        const previousViewbox =
          hasRenderedRef.current && userAdjustedViewportRef.current
            ? canvas.viewbox()
            : null;

        if (!hasRenderedRef.current) {
          setIsLoading(true);
        }

        try {
          await viewer.importXML(nextCode);

          if (cancelled) {
            break;
          }

          const nextCanvas = viewer.get<BpmnCanvas>("canvas");
          canvasRef.current = nextCanvas;
          nextCanvas.resized();

          if (previousViewbox && userAdjustedViewportRef.current) {
            nextCanvas.viewbox(previousViewbox);
          } else {
            nextCanvas.zoom("fit-viewport");
          }

          hasRenderedRef.current = true;
          setErrorMessage("");
          setHasRendered(true);
          setIsLoading(false);
          onViewerReadyRef.current?.(viewer);
        } catch (error) {
          // A newer streamed snapshot supersedes transient import failures.
          if (!cancelled && pendingCode === null) {
            setErrorMessage(getErrorMessage(error));
            setIsLoading(false);
          }
        }
      }

      importing = false;
    };

    enqueueImportRef.current = (nextCode: string) => {
      pendingCode = nextCode;
      setErrorMessage("");
      void importPendingCode();
    };

    const createViewer = async () => {
      const { default: BpmnViewer } = await import(
        "bpmn-js/dist/bpmn-navigated-viewer.production.min.js"
      );

      if (cancelled) {
        return;
      }

      const createdViewer = new BpmnViewer({ container });
      viewer = createdViewer;
      const canvas = createdViewer.get<BpmnCanvas>("canvas");
      canvasRef.current = canvas;

      // Debounce resize callbacks to one per frame. Calling canvas.resized()
      // synchronously inside the observer can re-trigger the observer and pin
      // the main thread, so coalesce bursts with requestAnimationFrame.
      resizeObserver = new ResizeObserver(() => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => canvas.resized());
      });
      resizeObserver.observe(container);
      void importPendingCode();
    };

    createViewer().catch((error) => {
      if (!cancelled) {
        setErrorMessage(getErrorMessage(error));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      enqueueImportRef.current = () => undefined;
      canvasRef.current = null;
      onViewerReadyRef.current?.(null);
      viewer?.destroy();
      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    enqueueImportRef.current(code);
  }, [code]);

  const showLoading = isLoading || (streaming && errorMessage && !hasRendered);
  const showError = errorMessage && !streaming;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div
        className={`absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/80 p-1 supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur-sm ${
          fullscreen ? "bottom-4 left-4" : "bottom-2 left-2"
        }`}
        data-streamdown="bpmn-controls"
      >
        <button
          className={CONTROL_BUTTON_CLASS}
          disabled={!hasRendered}
          onClick={() => zoomBy(ZOOM_STEP)}
          title="Zoom in"
          type="button"
        >
          <ZoomInIcon size={16} />
        </button>
        <button
          className={CONTROL_BUTTON_CLASS}
          disabled={!hasRendered}
          onClick={() => zoomBy(-ZOOM_STEP)}
          title="Zoom out"
          type="button"
        >
          <ZoomOutIcon size={16} />
        </button>
        <button
          className={CONTROL_BUTTON_CLASS}
          disabled={!hasRendered}
          onClick={resetView}
          title="Reset zoom and pan"
          type="button"
        >
          <RotateCcwIcon size={16} />
        </button>
      </div>
      {showLoading && !hasRendered ? (
        <div className="absolute inset-0 z-[1] bg-background">
          <BpmnLoadingIndicator />
        </div>
      ) : null}
      {showError ? (
        <div className="absolute inset-0 z-[2] overflow-auto rounded-md bg-red-50 p-4">
          <p className="font-mono text-red-700 text-sm">BPMN Error: {errorMessage}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600 text-xs">Show Code</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs">
              {code}
            </pre>
          </details>
        </div>
      ) : null}
      <div
        className="h-full w-full [&_.bjs-powered-by]:hidden"
        data-streamdown="bpmn-canvas"
        onPointerDownCapture={() => {
          userAdjustedViewportRef.current = true;
        }}
        onWheelCapture={() => {
          userAdjustedViewportRef.current = true;
        }}
        ref={containerRef}
      />
    </div>
  );
};

type BpmnBlockShellProps = {
  language: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
};

const BpmnBlockShell = ({ language, actions, children }: BpmnBlockShellProps) => (
  <div
    className="group relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2"
    data-streamdown="bpmn-block"
  >
    <div className="flex h-8 items-center text-muted-foreground text-xs">
      <span className="ml-1 font-mono lowercase">{language ?? "bpmn"}</span>
    </div>
    {actions ? (
      <div className="pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end">
        <div
          className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
          data-streamdown="bpmn-block-actions"
        >
          {actions}
        </div>
      </div>
    ) : null}
    {children}
  </div>
);

type BpmnDownloadButtonProps = {
  code: string;
  getViewer: () => Viewer | null;
};

const BpmnDownloadButton = ({ code, getViewer }: BpmnDownloadButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const path = event.composedPath();

      if (containerRef.current && !path.includes(containerRef.current)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);

    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  const downloadSvg = useCallback(async () => {
    const viewer = getViewer();

    if (!viewer) {
      return;
    }

    const { svg } = await viewer.saveSVG();
    downloadFile("diagram.svg", svg, "image/svg+xml");
    setIsOpen(false);
  }, [getViewer]);

  const downloadXml = useCallback(() => {
    downloadFile("diagram.bpmn", code, "application/xml");
    setIsOpen(false);
  }, [code]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={ACTION_BUTTON_CLASS}
        onClick={() => setIsOpen((open) => !open)}
        title="Download diagram"
        type="button"
      >
        <DownloadIcon size={14} />
      </button>
      {isOpen ? (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={downloadSvg}
            title="Download diagram as SVG"
            type="button"
          >
            SVG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={downloadXml}
            title="Download diagram as BPMN"
            type="button"
          >
            BPMN
          </button>
        </div>
      ) : null}
    </div>
  );
};

const BpmnCopyButton = ({ code }: { code: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const copyCode = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    timeoutRef.current = window.setTimeout(() => setIsCopied(false), COPY_RESET_MS);
  }, [code]);

  return (
    <button className={ACTION_BUTTON_CLASS} onClick={copyCode} title="Copy code" type="button">
      {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
    </button>
  );
};

const BpmnFullscreenButton = ({
  code,
  streaming = false,
}: {
  code: string;
  streaming?: boolean;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <>
      <button
        className={ACTION_BUTTON_CLASS}
        onClick={() => setIsFullscreen(true)}
        title="View fullscreen"
        type="button"
      >
        <Maximize2Icon size={14} />
      </button>
      {isMounted && isFullscreen
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
              <button
                className="absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                onClick={() => setIsFullscreen(false)}
                title="Exit fullscreen"
                type="button"
              >
                <XIcon size={20} />
              </button>
              <div className="flex size-full items-center justify-center p-4">
                <BpmnViewport code={code} fullscreen streaming={streaming} />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export const BpmnRenderer = ({
  code,
  language,
  isIncomplete,
}: CustomRendererProps) => {
  const viewerRef = useRef<Viewer | null>(null);

  const handleViewerReady = useCallback((viewer: Viewer | null) => {
    viewerRef.current = viewer;
  }, []);

  const getViewer = useCallback(() => viewerRef.current, []);

  if (!hasRenderableBpmnDiagram(code)) {
    return (
      <BpmnBlockShell language={language}>
        <div className="rounded-md border border-border bg-background">
          <div className="relative flex h-[520px] w-full flex-col">
            <BpmnLoadingIndicator />
          </div>
        </div>
      </BpmnBlockShell>
    );
  }

  const complete = !isIncomplete && isBpmnComplete(code);
  const renderCode = complete ? code : mendBpmn(code);

  return (
    <BpmnBlockShell
      actions={
        <>
          <BpmnDownloadButton code={renderCode} getViewer={getViewer} />
          <BpmnCopyButton code={renderCode} />
          <BpmnFullscreenButton code={renderCode} streaming={!complete} />
        </>
      }
      language={language}
    >
      <div className="rounded-md border border-border bg-background">
        <div className="relative h-[520px] w-full resize-y overflow-hidden">
          <BpmnViewport
            code={renderCode}
            onViewerReady={handleViewerReady}
            streaming={!complete}
          />
        </div>
      </div>
    </BpmnBlockShell>
  );
};

export const bpmnRenderers: CustomRenderer[] = [
  {
    language: ["bpmn"],
    component: BpmnRenderer,
  },
] satisfies CustomRenderer[];
