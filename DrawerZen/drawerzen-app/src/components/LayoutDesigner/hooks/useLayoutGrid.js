import { useState, useCallback, useEffect, useMemo } from 'react';
import { GRID_SIZE } from '../LayoutDesigner.constants';

export const useLayoutGrid = (initialDimensions = { width: 420, length: 420 }) => {
  const [drawerDimensions, setDrawerDimensions] = useState(() => ({
    width: Math.max(initialDimensions.width, GRID_SIZE),
    length: Math.max(initialDimensions.length, GRID_SIZE)
  }));
  
  const [cellPixelSize, setCellPixelSize] = useState(20);
  const [gridBounds, setGridBounds] = useState({ width: 0, height: 0 });
  
  // Recalculate gridCols and gridRows whenever drawerDimensions change
  const gridCols = useMemo(() => 
    Math.floor(drawerDimensions.width / GRID_SIZE), 
    [drawerDimensions.width]
  );
  
  const gridRows = useMemo(() => 
    Math.floor(drawerDimensions.length / GRID_SIZE), 
    [drawerDimensions.length]
  );
  
  // Recalculate aspect ratio whenever gridCols/gridRows change
  const gridAspectRatio = useMemo(() => 
    gridRows > 0 ? gridCols / gridRows : 1,
    [gridCols, gridRows]
  );

  const calculateGridSize = useCallback((containerWidth, containerHeight) => {
    // Validate grid dimensions
    if (gridCols <= 0 || gridRows <= 0) {
      setGridBounds({ width: 0, height: 0 });
      setCellPixelSize(20);
      return 20;
    }

    // Calculate available space (more conservative for mobile)
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 32 : 64;
    const buttonArea = isMobile ? 80 : 160;
    
    const availableWidth = Math.max(100, containerWidth - padding - buttonArea);
    const availableHeight = Math.max(100, containerHeight - (isMobile ? 120 : 80));

    // Calculate ideal dimensions maintaining aspect ratio
    let scaledWidth, scaledHeight;
    
    const containerAspectRatio = availableWidth / availableHeight;
    
    if (gridAspectRatio > containerAspectRatio) {
      // Grid is wider than container - fit to width
      scaledWidth = availableWidth;
      scaledHeight = availableWidth / gridAspectRatio;
    } else {
      // Grid is taller or equal - fit to height
      scaledHeight = availableHeight;
      scaledWidth = availableHeight * gridAspectRatio;
    }

    // Calculate cell size based on grid dimensions
    const cellPixelWidth = scaledWidth / gridCols;
    const cellPixelHeight = scaledHeight / gridRows;
    const finalCellPixelSize = Math.min(cellPixelWidth, cellPixelHeight);

    // Apply bounds with more reasonable limits
    const minCellSize = 12; // Minimum 12px per cell for touch targets
    const maxCellSize = 80; // Maximum 80px per cell
    const boundedCellSize = Math.max(minCellSize, Math.min(finalCellPixelSize, maxCellSize));
    
    // Calculate final grid bounds
    const finalWidth = boundedCellSize * gridCols;
    const finalHeight = boundedCellSize * gridRows;
    
    setGridBounds({ 
      width: Math.round(finalWidth), 
      height: Math.round(finalHeight) 
    });
    setCellPixelSize(boundedCellSize);
    
    return boundedCellSize;
  }, [gridCols, gridRows, gridAspectRatio]);

  // Update drawer dimensions when initialDimensions change
  useEffect(() => {
    if (initialDimensions) {
      setDrawerDimensions({
        width: Math.max(initialDimensions.width, GRID_SIZE),
        length: Math.max(initialDimensions.length, GRID_SIZE)
      });
    }
  }, [initialDimensions?.width, initialDimensions?.length]);

  return {
    drawerDimensions,
    setDrawerDimensions,
    cellPixelSize,
    gridBounds,
    gridCols,
    gridRows,
    gridAspectRatio,
    calculateGridSize
  };
};