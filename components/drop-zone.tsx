"use client";

import type React from "react";

import { useState, useCallback, useRef } from "react";
import { FileUp, File } from "lucide-react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
}

export function DropZone({ onFileSelected }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Decorative corner elements */}
      <div className="relative">
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-12 md:p-16 text-center
            transition-all duration-300 ease-out
            ${
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50"
            }
          `}
        >
          {/* Cross stitch corner decorations */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-secondary-foreground/20 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-secondary-foreground/20 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-secondary-foreground/20 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-secondary-foreground/20 rounded-br" />

          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div
              className={`
                inline-flex items-center justify-center w-20 h-20 rounded-2xl
                transition-all duration-300
                ${isDragOver ? "bg-primary text-primary-foreground scale-110" : "bg-accent text-accent-foreground"}
              `}
            >
              {isDragOver ? (
                <FileUp className="w-10 h-10 animate-bounce" />
              ) : (
                <File className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
                {isDragOver ? "Drop it here!" : "Drop your pattern PDF here"}
              </h2>
              <p className="text-muted-foreground">
                or{" "}
                <span className="text-primary font-medium underline underline-offset-2">
                  browse files
                </span>
              </p>
            </div>

            <p className="text-sm text-muted-foreground/70">
              Supports PDF files from popular pattern makers
            </p>
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className="bg-accent/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> Tips for best results
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Works best with multi-page pattern PDFs</li>
          <li>• Each page should contain part of the same pattern</li>
          <li>• Higher resolution PDFs produce clearer merged images</li>
        </ul>
      </div>
    </div>
  );
}
