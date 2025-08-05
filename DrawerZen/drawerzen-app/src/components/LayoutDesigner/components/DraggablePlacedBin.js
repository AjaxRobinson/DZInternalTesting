import React from 'react';
import { useDrag } from 'react-dnd';
import { PlacedBin } from '../LayoutDesigner.styles';

const DraggablePlacedBin = ({
  bin,
  cellSize,
  selected,
  isDragging,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd
}) => {
  const [{ isDragging: dragState }, drag] = useDrag({
    type: 'placed-bin',
    item: () => {
      onDragStart();
      return { 
        bin, 
        placedBinId: bin.id,
        fromGrid: true 
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: () => onDragEnd()
  });

  return (
    <PlacedBin
      ref={drag}
      style={{
        // Convert from millimeters to pixels using unified 21mm grid system
        // bin coordinates are in mm, each cell (cellSize pixels) represents 21mm
        left: (bin.x / 21) * cellSize,
        top: (bin.y / 21) * cellSize,
        width: (bin.width / 21) * cellSize,
        height: ((bin.length || bin.height) / 21) * cellSize
      }}
      color={bin.color}
      selected={selected}
      isDragging={isDragging || dragState}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {bin.label}
    </PlacedBin>
  );
};

export default DraggablePlacedBin;
