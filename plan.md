
## Cross Stitch Pattern PDF Merger

### Project Overview
Build a React application that takes cross stitch pattern PDFs (like those from StitchBox) and merges the split grid pages into a single unified pattern image. These PDFs typically split large patterns across multiple pages (e.g., 4 quadrants) with coordinate markers, and users need them combined into one complete pattern.

### Technical Stack
- React with Vite (already set up)
- pdfjs-dist for PDF parsing and rendering
- Canvas API for image manipulation and merging
- jspdf + file-saver for export options

### Core Features

**1. PDF Upload & Parsing**
- Drag-and-drop or click-to-upload interface for PDF files
- Use pdfjs-dist to render each PDF page to canvas at high resolution
- Identify which pages contain the pattern grid (typically have numbered axes like 10, 20, 30... along edges)
- Skip non-pattern pages (cover page, instructions, color key)

**2. Grid Detection & Extraction**
- Detect the grid boundaries on each page using the coordinate markers
- Pattern pages have axis labels (10, 20, 30, 40, 50) indicating stitch positions
- Extract just the grid area from each page, trimming margins and labels
- Determine the relative position of each grid section based on coordinate values

**3. Pattern Merging**
- Calculate the full pattern dimensions from coordinate ranges
- Create a combined canvas large enough for the complete pattern
- Position each extracted grid section correctly based on its coordinates
- Handle overlap regions (some patterns have 1-2 rows/columns of overlap for alignment)

**4. Export Options**
- Download as PNG (high resolution)
- Download as PDF (single page, scaled appropriately)
- Preview the merged result before downloading

### Example PDF Structure (from attached Arthur.pdf)
- Page 1: Cover page with StitchBox branding
- Pages 2-5: Pattern grid split into 4 quadrants
    - Each quadrant shows coordinates (e.g., Page 2 shows columns 10-50, rows 1-50)
    - Grid contains symbols representing different thread colors
- Page 6: Instructions and color key

### UI Requirements
- Clean, craft-inspired aesthetic
- Progress indicator during processing
- Thumbnail previews of extracted pages before merge
- Zoomable/pannable view of merged result
- Clear error messages if PDF format isn't recognized

### Edge Cases to Handle
- Different grid sizes and page counts (2x2, 2x3, 3x3 layouts)
- Patterns with or without overlap regions
- Various PDF resolutions and qualities
- PDFs where pattern doesn't start on page 2
