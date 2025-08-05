import { useState, useCallback } from 'react';

export const useDragAndDrop = (placedBins, setPlacedBins, gridCols, gridRows, cellPixelSize, checkBounds, checkCollision) => {
  const [draggedBin, setDraggedBin] = useState(null);
  const [dropShadow, setDropShadow] = useState(null);
  const [isCarouselDropTarget, setIsCarouselDropTarget] = useState(false);

  const handleDragStart = useCallback((bin) => {
    setDraggedBin(bin);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBin(null);
    setDropShadow(null);
    setIsCarouselDropTarget(false);
  }, []);

  const handleGridHover = useCallback((x, y) => {
    if (!draggedBin) return;

    const newBin = { ...draggedBin, x, y };
    const isValid = checkBounds(newBin) && !checkCollision(newBin, draggedBin.id);

    // Convert millimeter coordinates to pixel positions for shadow display
    // Calculate pixel size per millimeter based on current grid dimensions
    const binLength = draggedBin.length;
    
    // Use the actual cell pixel size from the current grid layout
    const pixelX = (x / 21) * cellPixelSize;
    const pixelY = (y / 21) * cellPixelSize;
    const pixelWidth = (draggedBin.width / 21) * cellPixelSize;
    const pixelHeight = (binLength / 21) * cellPixelSize;

    setDropShadow({
      left: pixelX,
      top: pixelY,
      width: pixelWidth,
      height: pixelHeight,
      visible: true,
      error: !isValid
    });
  }, [draggedBin, cellPixelSize, checkBounds, checkCollision]);

  const handleGridDrop = useCallback((x, y) => {
    if (!draggedBin) return;

    const newBin = { ...draggedBin, x, y };
    const isValid = checkBounds(newBin) && !checkCollision(newBin, draggedBin.id);

    if (isValid) {
      setPlacedBins(prev => 
        prev.map(bin => 
          bin.id === draggedBin.id 
            ? { ...bin, x, y }
            : bin
        )
      );
    }

    setDraggedBin(null);
    setDropShadow(null);
  }, [draggedBin, checkBounds, checkCollision, setPlacedBins]);

  const handleCarouselDrop = useCallback(() => {
    if (!draggedBin) return;

    setPlacedBins(prev => prev.filter(bin => bin.id !== draggedBin.id));
    setDraggedBin(null);
    setIsCarouselDropTarget(false);
  }, [draggedBin, setPlacedBins]);

  const handleCarouselDragOver = useCallback(() => {
    if (draggedBin) {
      setIsCarouselDropTarget(true);
    }
  }, [draggedBin]);

  const handleCarouselDragLeave = useCallback(() => {
    setIsCarouselDropTarget(false);
  }, []);

  return {
    draggedBin,
    dropShadow,
    isCarouselDropTarget,
    handleDragStart,
    handleDragEnd,
    handleGridHover,
    handleGridDrop,
    handleCarouselDrop,
    handleCarouselDragOver,
    handleCarouselDragLeave,
    setDropShadow
  };
};
