import React, { forwardRef } from 'react';
import DraggablePlacedBin from './DraggablePlacedBin';
import { 
  Grid, 
  GridCell,
  DrawingOverlay, 
  DrawingPreview, 
  DropShadow 
} from '../LayoutDesigner.styles';

const BinGrid = forwardRef(({
  gridCols,
  gridRows,
  cellSize,
  placedBins,
  selectedBin,
  onBinClick,
  onBinDoubleClick,
  draggedBin,
  onDragStart,
  onDragEnd,
  dropShadow,
  onGridHover,
  onGridDrop,
  drawingContainerRef,
  isDrawing,
  drawingPreview,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  underlayImage
}, ref) => {
  return (
    <Grid 
      cols={gridCols} 
      rows={gridRows} 
      cellSize={cellSize}
      ref={(el) => {
        // Assign both refs
        if (drawingContainerRef) drawingContainerRef.current = el;
        if (ref) ref(el);
      }}
      data-grid="true"
      style={{
        backgroundImage: underlayImage ? `url(${underlayImage})` : 'none',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Render 21mm grid cells with visual emphasis lines every 42mm */}
      {Array.from({ length: gridRows * gridCols }, (_, index) => {
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        
        // Create emphasis on grid lines every 2 cells (every 42mm)
        // This creates a visual 42mm grid pattern over the 21mm base grid
        const hasTopEmphasis = row % 2 === 0;
        const hasLeftEmphasis = col % 2 === 0;
        
        return (
          <GridCell 
            key={index} 
            cellSize={cellSize}
            hasTopEmphasis={hasTopEmphasis}
            hasLeftEmphasis={hasLeftEmphasis}
          />
        );
      })}

      {/* Drawing overlay - only active when not dragging */}
      <DrawingOverlay
        onMouseDown={draggedBin ? undefined : onMouseDown}
        onMouseMove={draggedBin ? undefined : onMouseMove}
        onMouseUp={draggedBin ? undefined : onMouseUp}
        style={{
          pointerEvents: draggedBin ? 'none' : 'auto'
        }}
      />

      {/* Drawing preview */}
      {isDrawing && drawingPreview && (
        <DrawingPreview
          style={{
            left: drawingPreview.left,
            top: drawingPreview.top,
            width: drawingPreview.width,
            height: drawingPreview.height
          }}
          error={drawingPreview.hasError}
        />
      )}

      {/* Drop shadow */}
      {dropShadow && (
        <DropShadow
          style={{
            left: dropShadow.left,
            top: dropShadow.top,
            width: dropShadow.width,
            height: dropShadow.height
          }}
          visible={dropShadow.visible}
          error={dropShadow.error}
        />
      )}

      {/* Placed bins */}
      {placedBins.map(bin => (
        <DraggablePlacedBin
          key={bin.id}
          bin={bin}
          cellSize={cellSize}
          selected={selectedBin?.id === bin.id}
          isDragging={draggedBin?.id === bin.id}
          onClick={() => onBinClick(bin)}
          onDoubleClick={() => onBinDoubleClick(bin)}
          onDragStart={() => onDragStart(bin)}
          onDragEnd={onDragEnd}
        />
      ))}
    </Grid>
  );
});

BinGrid.displayName = 'BinGrid';

export default BinGrid;
