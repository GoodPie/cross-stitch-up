"use client";

import type React from "react";

import { useState, useCallback, useRef } from "react";
import { FileUp, File } from "lucide-react";

interface DropZoneProps {
    readonly onFileSelected: (file: File) => void;
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
        [onFileSelected]
    );

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
        }
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
                    tabIndex={0}
                    role={"button"}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ease-out md:p-16 ${
                        isDragOver
                            ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
                            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50"
                    } `}
                >
                    {/* Cross-stitch corner decorations */}
                    <div className="border-secondary-foreground/20 absolute top-3 left-3 h-6 w-6 rounded-tl border-t-2 border-l-2" />
                    <div className="border-secondary-foreground/20 absolute top-3 right-3 h-6 w-6 rounded-tr border-t-2 border-r-2" />
                    <div className="border-secondary-foreground/20 absolute bottom-3 left-3 h-6 w-6 rounded-bl border-b-2 border-l-2" />
                    <div className="border-secondary-foreground/20 absolute right-3 bottom-3 h-6 w-6 rounded-br border-r-2 border-b-2" />

                    <input ref={inputRef} type="file" accept=".pdf" onChange={handleChange} className="hidden" />

                    <div className="space-y-4">
                        <div
                            className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${isDragOver ? "bg-primary text-primary-foreground scale-110" : "bg-accent text-accent-foreground"} `}
                        >
                            {isDragOver ? (
                                <FileUp className="h-10 w-10 animate-bounce" />
                            ) : (
                                <File className="h-10 w-10" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-foreground font-serif text-xl font-semibold md:text-2xl">
                                {isDragOver ? "Drop it here!" : "Drop your pattern PDF here"}
                            </h2>
                            <p className="text-muted-foreground">
                                or{" "}
                                <span className="text-primary font-medium underline underline-offset-2">
                                    browse files
                                </span>
                            </p>
                        </div>

                        <p className="text-muted-foreground/70 text-sm">
                            Supports PDF files from popular pattern makers
                        </p>
                    </div>
                </div>
            </div>

            {/* Tips section */}
            <div className="bg-accent/50 border-border/50 rounded-xl border p-4">
                <h3 className="text-foreground mb-2 flex items-center gap-2 font-medium">
                    <span className="text-lg">💡</span> Tips for best results
                </h3>
                <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Works best with multi-page pattern PDFs</li>
                    <li>• Each page should contain part of the same pattern</li>
                    <li>• Higher resolution PDFs produce clearer merged images</li>
                </ul>
            </div>
        </div>
    );
}
