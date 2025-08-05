import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';

// Modular imports
import { GRID_SIZE, STANDARD_BIN_SIZES, colors } from './LayoutDesigner.constants';
import { calculatePrice, calculateBinPrice, calculateBaseplateCost } from './LayoutDesigner.utils';
import { 
  DesignerContainer,
  BinCarousel,
  CarouselContent,
  CarouselHeader,
  DrawerContainer,
  GridSection,
  GridAndPanelContainer,
  GridContainer,
  GridWrapper,
  GridBoundingBox,
  ErrorNotification,
  CenterErrorMessage,
  InstructionText
} from './LayoutDesigner.styles';

// Custom hooks
import { useLayoutGrid } from './hooks/useLayoutGrid';
import { useBinManagement } from './hooks/useBinManagement';
import { useBinDrawing } from './hooks/useBinDrawing';
import { useDragAndDrop } from './hooks/useDragAndDrop';

// Services
import { BinSortingService } from './services/BinSortingService';

// Components
import ActionButtons from './components/ActionButtons';
import BinGrid from './components/BinGrid';
import DraggableBin from './DraggableBin';
import BinModificationPanel from './BinModificationPanel';

export default function LayoutDesigner({ drawerDimensions, availableBins = [], onLayoutComplete }) {
  const navigate = useNavigate();
  
  // Window size state for responsive grid
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Layout grid hook
  const {
    drawerDimensions: gridDimensions,
    setDrawerDimensions,
    cellPixelSize,
    setCellPixelSize,
    gridBounds,
    gridCols,
    gridRows,
    gridAspectRatio,
    calculateGridSize
  } = useLayoutGrid(drawerDimensions);

  // Update drawer dimensions when props change
  useEffect(() => {
    if (drawerDimensions) {
      setDrawerDimensions(drawerDimensions);
    }
  }, [drawerDimensions, setDrawerDimensions]);

  // Bin management hook
  const {
    placedBins,
    setPlacedBins,
    selectedBin,
    setSelectedBin,
    addBin,
    removeBin,
    clearAllBins,
    moveBin,
    selectBin,
    checkCollision,
    checkBounds,
    isValidPlacement
  } = useBinManagement(gridCols, gridRows);

  // Calculate responsive cell size
  useEffect(() => {
    const panelWidth = selectedBin ? 320 : 0;
    const buttonWidth = 160;
    const isMobile = windowSize.width < 768;
    const gutterWidth = isMobile ? 32 : 80;
    const containerPadding = isMobile ? 32 : 64;
    
    const maxGridWidth = windowSize.width - gutterWidth - containerPadding - panelWidth - buttonWidth;
    const maxGridHeight = (windowSize.height - 80) * 0.65; // Use 65% of remaining viewport height for grid area after nav
    
    calculateGridSize(maxGridWidth, maxGridHeight);
  }, [windowSize, selectedBin, calculateGridSize]);

  // Bin drawing hook
  const {
    isDrawing,
    drawingPreview,
    drawingError,
    errorMessage,
    drawingContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setErrorMessage
  } = useBinDrawing(gridCols, gridRows, placedBins, setPlacedBins, GRID_SIZE);

  // Drag and drop hook
  const {
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
  } = useDragAndDrop(placedBins, setPlacedBins, gridCols, gridRows, cellPixelSize, checkBounds, checkCollision);

  // State for remaining bins and errors
  const [remainingBins, setRemainingBins] = useState([...availableBins]);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [centerErrorMessage, setCenterErrorMessage] = useState(null);

  // Utility function for center error messages
  const showCenterError = (message) => {
    setCenterErrorMessage(message);
    setTimeout(() => setCenterErrorMessage(null), 3000);
  };

  // Carousel drop zone setup
  const [, carouselDrop] = useDrop({
    accept: ['bin', 'placed-bin'],
    drop: (item) => {
      if (item.placedBinId) {
        // Moving bin from grid to carousel
        const binToMove = placedBins.find(bin => bin.id === item.placedBinId);
        if (binToMove) {
          // Remove from placed bins
          setPlacedBins(prev => prev.filter(bin => bin.id !== item.placedBinId));
          
          // Find original bin data or create carousel version
          const originalBin = availableBins.find(b => b.id === binToMove.originalId) || {
            id: binToMove.originalId || binToMove.id,
            label: binToMove.name,
            width: binToMove.width,
            length: binToMove.length,
            color: binToMove.color
          };
          
          // Add back to carousel
          setRemainingBins(prev => [...prev, originalBin]);
        }
      }
    },
    hover: handleCarouselDragOver,
    collect: (monitor) => ({
      isCarouselDropTarget: monitor.isOver() && monitor.getItem()?.placedBinId,
    }),
  });

  // Main grid drop zone setup
  const [{ isOver }, drop] = useDrop({
    accept: ['bin', 'placed-bin'],
    hover: (item, monitor) => {
      if (item.bin || item.placedBinId) {
        const gridElement = document.querySelector('[data-grid="true"]');
        const clientOffset = monitor.getClientOffset();
        
        if (gridElement && clientOffset) {
          const gridRect = gridElement.getBoundingClientRect();
          const x = clientOffset.x - gridRect.left;
          const y = clientOffset.y - gridRect.top;
          
          // Calculate position in 21mm increments using unified grid system
          const gridX = Math.floor(x / cellPixelSize);
          const gridY = Math.floor(y / cellPixelSize);
          
          // Convert to millimeter coordinates (21mm increments)
          const mmX = gridX * GRID_SIZE;
          const mmY = gridY * GRID_SIZE;
          
          // Create virtual dragged bin for carousel items or use existing draggedBin
          let currentDraggedBin = draggedBin;
          
          if (item.bin && !currentDraggedBin) {
            // Bin from carousel - create virtual dragged bin
            currentDraggedBin = {
              id: item.bin.id,
              width: item.bin.width,
              length: item.bin.length,
              x: mmX,
              y: mmY
            };
          }
          
          if (currentDraggedBin) {
            const newBin = { ...currentDraggedBin, x: mmX, y: mmY };
            const isValid = checkBounds(newBin) && !checkCollision(newBin, currentDraggedBin.id);

            // Convert millimeter coordinates to pixel positions for shadow display
            const pixelX = (mmX / 21) * cellPixelSize;
            const pixelY = (mmY / 21) * cellPixelSize;
            const pixelWidth = (currentDraggedBin.width / 21) * cellPixelSize;
            const pixelHeight = (currentDraggedBin.length / 21) * cellPixelSize;

            setDropShadow({
              left: pixelX,
              top: pixelY,
              width: pixelWidth,
              height: pixelHeight,
              visible: true,
              error: !isValid
            });
          } else {
            handleGridHover(mmX, mmY);
          }
        }
      }
    },
    drop: (item, monitor) => {
      const gridElement = document.querySelector('[data-grid="true"]');
      const clientOffset = monitor.getClientOffset();
      
      if (gridElement && clientOffset) {
        const gridRect = gridElement.getBoundingClientRect();
        const x = clientOffset.x - gridRect.left;
        const y = clientOffset.y - gridRect.top;
        
        // Calculate position in 21mm increments using unified grid system
        const gridX = Math.floor(x / cellPixelSize);
        const gridY = Math.floor(y / cellPixelSize);
        
        if (item.placedBinId) {
          // Moving existing bin - convert to millimeters
          const newX = gridX * GRID_SIZE; // 21mm increments
          const newY = gridY * GRID_SIZE;
          
          if (isValidPlacement({ ...draggedBin, x: newX, y: newY }, item.placedBinId)) {
            moveBin(item.placedBinId, newX, newY);
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        } else if (item.bin) {
          // Placing new bin from carousel - convert to millimeters
          const newBin = {
            id: uuidv4(),
            originalId: item.bin.id,
            x: gridX * GRID_SIZE, // Convert to 21mm increments
            y: gridY * GRID_SIZE,
            width: item.bin.width,
            length: item.bin.length,
            height: 21,
            shadowBoard: false,
            name: item.bin.label,
            color: item.bin.color
          };

          if (isValidPlacement(newBin)) {
            addBin(newBin);
            setRemainingBins(prev => prev.filter(bin => bin.id !== item.bin.id));
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Clear drop shadow when not hovering over grid
  useEffect(() => {
    if (!isOver) {
      setDropShadow(null);
    }
  }, [isOver, setDropShadow]);

  // Bin event handlers
  const handleBinClick = (bin) => {
    selectBin(bin);
    setSelectedBinId(bin.id);
  };

  const handleBinDoubleClick = (bin) => {
    removeBin(bin.id);
    
    // Add back to available bins if it was originally from availableBins
    const originalBin = availableBins.find(b => b.id === bin.originalId);
    if (originalBin) {
      setRemainingBins(prev => [...prev, originalBin]);
    }
  };

  const handleBinSave = (updatedBin) => {
    setPlacedBins(prev => prev.map(bin => 
      bin.id === updatedBin.id ? updatedBin : bin
    ));
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleBinDelete = (binId) => {
    handleBinDoubleClick(placedBins.find(bin => bin.id === binId));
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handlePanelClose = () => {
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  // Action button handlers
  const handleAutoSort = () => {
    if (placedBins.length === 0) {
      showCenterError('No bins to sort');
      return;
    }

    const { placedBins: sortedBins, unplacedBins } = BinSortingService.autoSortBins(
      placedBins, 
      gridCols, 
      gridRows
    );

    setPlacedBins(sortedBins);
    
    if (unplacedBins.length > 0) {
      // Add unplaced bins back to carousel
      const carouselBins = unplacedBins.map(bin => ({
        id: bin.originalId || bin.id,
        label: bin.name,
        width: bin.width,
        length: bin.length,
        color: bin.color
      }));
      setRemainingBins(prev => [...prev, ...carouselBins]);
      showCenterError(`Sorted ${sortedBins.length} bins, ${unplacedBins.length} returned to carousel`);
    } else {
      showCenterError('All bins sorted successfully!');
    }
  };

  const handleGenerateBins = () => {
    const newBins = [];
    let binCounter = 0;
    let currentPlacedBins = [...placedBins]; // Working copy to track placements
    
    // Continue placing bins until no more can be placed
    let canPlaceMore = true;
    let iterations = 0;
    const maxIterations = 200; // Increased limit for comprehensive filling
    
    while (canPlaceMore && iterations < maxIterations) {
      iterations++;
      canPlaceMore = false;
      
      // Find all available gaps (minimum 2 cells area to avoid 1x1 gaps)
      const gaps = BinSortingService.findAllGaps(gridCols, gridRows, currentPlacedBins, 2);
      
      if (gaps.length === 0) {
        break; // No more fillable gaps available
      }

      // Try to fill each gap with the largest possible bin
      for (const gap of gaps) {
        // Convert gap dimensions to millimeters
        const gapWidthMM = gap.width * GRID_SIZE;
        const gapHeightMM = gap.height * GRID_SIZE;

        // Try to fit the largest possible bin in this gap
        let binPlaced = false;
        for (const binSize of STANDARD_BIN_SIZES) {
          // Check if bin fits in the gap
          if (binSize.width <= gapWidthMM && binSize.length <= gapHeightMM) {
            const newBin = {
              id: uuidv4(),
              x: gap.x * GRID_SIZE, // Convert cell position to mm
              y: gap.y * GRID_SIZE, // Convert cell position to mm
              width: binSize.width,
              length: binSize.length,
              height: 21,
              shadowBoard: false,
              name: `Auto ${binCounter + 1}`,
              color: colors[binCounter % colors.length]
            };

            // Check if this placement is valid
            if (BinSortingService.checkValidPlacement(newBin, currentPlacedBins, gridCols, gridRows)) {
              // Add to both our tracking array and the actual bins array
              currentPlacedBins.push(newBin);
              newBins.push(newBin);
              addBin(newBin);
              binCounter++;
              canPlaceMore = true; // We placed a bin, so continue trying
              binPlaced = true;
              break; // Move to next gap after placing one bin
            }
          }
        }

        // If we placed a bin, break out of gap loop and recalculate gaps
        if (binPlaced) {
          break;
        }
      }
    }

    if (newBins.length > 0) {
      showCenterError(`Added ${newBins.length} auto-generated bins!`);
    } else {
      showCenterError('No suitable bin size found for available space');
    }
  };

  const handleReset = () => {
    clearAllBins();
    setRemainingBins([...availableBins]);
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleReview = () => {
    if (placedBins.length === 0) {
      setErrorMessage('Please place at least one bin before proceeding.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const binsTotal = placedBins.reduce((sum, bin) => sum + calculateBinPrice(bin), 0);
    const baseplateTotal = calculateBaseplateCost(gridDimensions);
    
    const layoutData = {
      bins: placedBins,
      drawerDimensions: gridDimensions,
      totalCost: binsTotal + baseplateTotal,
      binsCost: binsTotal,
      baseplateCost: baseplateTotal
    };
    
    onLayoutComplete(layoutData);
    navigate('/review');
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBinId) {
          e.preventDefault();
          handleBinDelete(selectedBinId);
        }
      }
      if (e.key === 'Escape') {
        handlePanelClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBinId]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DesignerContainer>
      <BinCarousel ref={carouselDrop} isCarouselDropTarget={isCarouselDropTarget}>
        <CarouselHeader hasBins={remainingBins.length > 0} style={{ color: '#374151' }}>
          Available Bins {isCarouselDropTarget && '(Drop here to store)'}
        </CarouselHeader>
        <CarouselContent hasBins={remainingBins.length > 0}>
          {remainingBins.map((bin) => (
            <DraggableBin key={bin.id} bin={bin} mode="carousel" />
          ))}
          {remainingBins.length === 0 && (
            <p style={{ color: '#6b7280', margin: 0 }}>All bins have been placed</p>
          )}
        </CarouselContent>
      </BinCarousel>

      <DrawerContainer>
        <GridAndPanelContainer>
          <GridContainer>
            <GridSection>
              <GridWrapper>
                <ActionButtons 
                  onAutoSort={handleAutoSort}
                  onGenerateBins={handleGenerateBins}
                  onReset={handleReset}
                  onReview={handleReview}
                  hasPlacedBins={placedBins.length > 0}
                />

                <GridBoundingBox 
                  width={gridBounds.width}
                  height={gridBounds.height}
                >
                  <BinGrid
                    ref={drop}
                    gridCols={gridCols}
                    gridRows={gridRows}
                    cellSize={cellPixelSize}
                    placedBins={placedBins}
                    selectedBin={selectedBin}
                    onBinClick={handleBinClick}
                    onBinDoubleClick={handleBinDoubleClick}
                    draggedBin={draggedBin}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    dropShadow={dropShadow}
                    onGridHover={handleGridHover}
                    onGridDrop={handleGridDrop}
                    drawingContainerRef={drawingContainerRef}
                    isDrawing={isDrawing}
                    drawingPreview={drawingPreview}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  />
                </GridBoundingBox>
              </GridWrapper>

              <InstructionText>
                Click and drag to draw custom bins • Double-click bins to delete • Drop bins here to place them
              </InstructionText>
            </GridSection>
          </GridContainer>

          <BinModificationPanel
            open={!!selectedBin}
            bin={selectedBin}
            onClose={handlePanelClose}
            onSave={handleBinSave}
            onDelete={handleBinDelete}
          />
        </GridAndPanelContainer>
      </DrawerContainer>

      {errorMessage && (
        <ErrorNotification>
          {errorMessage}
        </ErrorNotification>
      )}

      {centerErrorMessage && (
        <CenterErrorMessage>
          {centerErrorMessage}
        </CenterErrorMessage>
      )}
    </DesignerContainer>
  );
}
