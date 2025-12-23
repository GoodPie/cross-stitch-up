"use client";

import { useState } from "react";
import { FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadAsPng } from "@/lib/export/png-exporter";
import { downloadAsPdf } from "@/lib/export/pdf-exporter";
import { calculateMaintainedDimension } from "@/lib/export/canvas-scaler";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvas: HTMLCanvasElement | null;
  filename: string;
}

type SizeMode = "original" | "pixels" | "print";
type ExportFormat = "png" | "pdf";

const DPI_OPTIONS = [
  { value: "150", label: "150 DPI (Draft)" },
  { value: "300", label: "300 DPI (Standard)" },
  { value: "600", label: "600 DPI (High Quality)" },
];

export function ExportDialog({
  open,
  onOpenChange,
  canvas,
  filename,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [sizeMode, setSizeMode] = useState<SizeMode>("original");
  const [pixelWidth, setPixelWidth] = useState<string>("");
  const [pixelHeight, setPixelHeight] = useState<string>("");
  const [printWidth, setPrintWidth] = useState<string>("8");
  const [printHeight, setPrintHeight] = useState<string>("10");
  const [dpi, setDpi] = useState<string>("300");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [trackedCanvas, setTrackedCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );

  // Sync pixel dimensions when canvas changes (state adjustment during render)
  if (canvas !== trackedCanvas) {
    setTrackedCanvas(canvas);
    if (canvas) {
      setPixelWidth(String(canvas.width));
      setPixelHeight(String(canvas.height));
    }
  }

  // Calculate output dimensions for preview
  const getOutputDimensions = (): { width: number; height: number } | null => {
    if (!canvas) return null;

    switch (sizeMode) {
      case "original":
        return { width: canvas.width, height: canvas.height };
      case "pixels":
        return {
          width: parseInt(pixelWidth) || canvas.width,
          height: parseInt(pixelHeight) || canvas.height,
        };
      case "print":
        const w = parseFloat(printWidth) || 8;
        const h = parseFloat(printHeight) || 10;
        const d = parseInt(dpi) || 300;
        return { width: Math.round(w * d), height: Math.round(h * d) };
      default:
        return null;
    }
  };

  const handlePixelWidthChange = (value: string) => {
    setPixelWidth(value);
    if (maintainAspectRatio && canvas && value) {
      const newHeight = calculateMaintainedDimension(
        canvas,
        "width",
        parseInt(value),
      );
      setPixelHeight(String(newHeight));
    }
  };

  const handlePixelHeightChange = (value: string) => {
    setPixelHeight(value);
    if (maintainAspectRatio && canvas && value) {
      const newWidth = calculateMaintainedDimension(
        canvas,
        "height",
        parseInt(value),
      );
      setPixelWidth(String(newWidth));
    }
  };

  const handlePrintWidthChange = (value: string) => {
    setPrintWidth(value);
    if (maintainAspectRatio && canvas && value) {
      const aspectRatio = canvas.width / canvas.height;
      const newHeight = parseFloat(value) / aspectRatio;
      setPrintHeight(newHeight.toFixed(2));
    }
  };

  const handlePrintHeightChange = (value: string) => {
    setPrintHeight(value);
    if (maintainAspectRatio && canvas && value) {
      const aspectRatio = canvas.width / canvas.height;
      const newWidth = parseFloat(value) * aspectRatio;
      setPrintWidth(newWidth.toFixed(2));
    }
  };

  const handleExport = () => {
    if (!canvas) return;

    const options = {
      sizeMode,
      width:
        sizeMode === "pixels" ? parseInt(pixelWidth) : parseFloat(printWidth),
      height:
        sizeMode === "pixels" ? parseInt(pixelHeight) : parseFloat(printHeight),
      dpi: parseInt(dpi),
      maintainAspectRatio,
    };

    if (format === "png") {
      downloadAsPng(canvas, filename, options);
    } else {
      downloadAsPdf(canvas, filename, {
        ...options,
      });
    }

    onOpenChange(false);
  };

  const outputDimensions = getOutputDimensions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Export Pattern</DialogTitle>
          <DialogDescription>
            Choose your export format and size options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="format-png" />
                <Label
                  htmlFor="format-png"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileImage className="w-4 h-4" />
                  PNG Image
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label
                  htmlFor="format-pdf"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  PDF Document
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Size Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Size</Label>
            <RadioGroup
              value={sizeMode}
              onValueChange={(v) => setSizeMode(v as SizeMode)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="original" id="size-original" />
                <Label htmlFor="size-original" className="cursor-pointer">
                  Original size ({canvas?.width} x {canvas?.height} px)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pixels" id="size-pixels" />
                <Label htmlFor="size-pixels" className="cursor-pointer">
                  Custom pixel dimensions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="size-print" />
                <Label htmlFor="size-print" className="cursor-pointer">
                  Print size (inches)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Pixel Dimensions */}
          {sizeMode === "pixels" && (
            <div className="space-y-3 pl-6 border-l-2 border-border">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="pixel-width" className="text-xs">
                    Width (px)
                  </Label>
                  <Input
                    id="pixel-width"
                    type="number"
                    value={pixelWidth}
                    onChange={(e) => handlePixelWidthChange(e.target.value)}
                    min={1}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="pixel-height" className="text-xs">
                    Height (px)
                  </Label>
                  <Input
                    id="pixel-height"
                    type="number"
                    value={pixelHeight}
                    onChange={(e) => handlePixelHeightChange(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aspect-ratio-pixels"
                  checked={maintainAspectRatio}
                  onCheckedChange={(checked) =>
                    setMaintainAspectRatio(checked === true)
                  }
                />
                <Label
                  htmlFor="aspect-ratio-pixels"
                  className="text-xs cursor-pointer"
                >
                  Maintain aspect ratio
                </Label>
              </div>
            </div>
          )}

          {/* Print Dimensions */}
          {sizeMode === "print" && (
            <div className="space-y-3 pl-6 border-l-2 border-border">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="print-width" className="text-xs">
                    Width (inches)
                  </Label>
                  <Input
                    id="print-width"
                    type="number"
                    value={printWidth}
                    onChange={(e) => handlePrintWidthChange(e.target.value)}
                    min={0.1}
                    step={0.1}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="print-height" className="text-xs">
                    Height (inches)
                  </Label>
                  <Input
                    id="print-height"
                    type="number"
                    value={printHeight}
                    onChange={(e) => handlePrintHeightChange(e.target.value)}
                    min={0.1}
                    step={0.1}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dpi" className="text-xs">
                  Resolution (DPI)
                </Label>
                <Select value={dpi} onValueChange={setDpi}>
                  <SelectTrigger id="dpi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DPI_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aspect-ratio-print"
                  checked={maintainAspectRatio}
                  onCheckedChange={(checked) =>
                    setMaintainAspectRatio(checked === true)
                  }
                />
                <Label
                  htmlFor="aspect-ratio-print"
                  className="text-xs cursor-pointer"
                >
                  Maintain aspect ratio
                </Label>
              </div>
            </div>
          )}

          {/* Output Preview */}
          {outputDimensions && (
            <div className="bg-accent/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Output: </span>
              <span className="font-medium">
                {outputDimensions.width.toLocaleString()} x{" "}
                {outputDimensions.height.toLocaleString()} pixels
              </span>
              {sizeMode === "print" && (
                <span className="text-muted-foreground">
                  {" "}
                  ({printWidth}&#34; x {printHeight}&#34; at {dpi} DPI)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            {format === "png" ? (
              <FileImage className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
