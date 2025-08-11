import styled from 'styled-components';
import { LAYOUT_CONSTANTS } from './LayoutDesigner.constants';

export const DesignerContainer = styled.div`
  width: 100%;
  height: calc(100vh - 80px); /* Full viewport minus navbar height */
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Common spacing between carousel and grid */
  padding: 1rem; /* Add consistent padding */
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
  
  * {
    box-sizing: border-box;
  }
  
  @media (max-width: 768px) {
    height: calc(100vh - 70px); /* Adjusted for mobile navbar */
    padding: 0.75rem; /* Slightly less padding on mobile */
    gap: 0.75rem; /* Slightly less gap on mobile */
  }
`;

export const BinCarousel = styled.div`
  background: white;
  padding: 0; /* Remove padding to prevent bin cutoff */
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden; /* Remove scroll bars */
  flex-shrink: 0;
  height: calc(12vh - 20px); /* Reduced height to fit better */
  width: 100%; /* Use full width within container */
  border: ${props => props.isCarouselDropTarget ? '2px dashed #4f46e5' : '2px solid transparent'};
  background: ${props => props.isCarouselDropTarget ? '#f0f9ff' : 'white'};
  transition: all 0.3s ease;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  
  /* Dynamic pattern when ready for drop */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isCarouselDropTarget ? 
      'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(79, 70, 229, 0.1) 10px, rgba(79, 70, 229, 0.1) 20px)' : 
      'none'
    };
    border-radius: 12px;
    pointer-events: none;
    opacity: ${props => props.isCarouselDropTarget ? 1 : 0};
    transition: opacity 0.3s ease;
    animation: ${props => props.isCarouselDropTarget ? 'movePattern 2s linear infinite' : 'none'};
  }
  
  @keyframes movePattern {
    0% { background-position: 0 0; }
    100% { background-position: 28px 28px; }
  }
  
  @media (max-width: 768px) {
    padding: 0; /* Remove padding for mobile too */
    height: calc(10vh - 15px); /* Reduced height for mobile */
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    transition: opacity 0.6s ease-in-out, max-height 0.6s ease-in-out;
    position: relative;
    z-index: 1;
    
    @media (max-width: 768px) {
      font-size: 0.8rem;
      margin: 0 0 0.5rem 0;
    }
  }
`;

export const CarouselContent = styled.div`
  display: flex;
  gap: 0.75rem; /* Increased gap for better spacing */
  min-width: min-content;
  padding: 0 1rem 0.5rem 1rem; /* Add horizontal and bottom padding */
  justify-content: ${props => props.hasBins ? 'center' : 'center'}; /* Always center */
  align-items: center; /* Center align the square bins */
  flex: 1; /* Take remaining space after header */
  overflow: hidden; /* Prevent overflow */
  flex-wrap: wrap; /* Allow wrapping if needed */
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    padding: 0 0.75rem 0.5rem 0.75rem; /* Adjust padding for mobile */
  }
  
  /* Empty state message styling */
  p {
    transition: opacity 0.6s ease-in-out, max-height 0.6s ease-in-out;
    max-height: ${props => props.hasBins ? '0' : '2rem'};
    opacity: ${props => props.hasBins ? 0 : 1};
    overflow: hidden;
  }
`;

export const CarouselHeader = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  transition: opacity 0.6s ease-in-out, max-height 0.6s ease-in-out;
  position: relative;
  z-index: 1;
  max-height: ${props => props.hasBins ? '0' : '2rem'};
  opacity: ${props => props.hasBins ? 0 : 1};
  overflow: hidden;
  padding: 0.5rem 1rem 0 1rem; /* Add padding for text spacing */
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin: 0 0 0.5rem 0;
    padding: 0.5rem 0.75rem 0 0.75rem; /* Adjust padding for mobile */
  }
`;

export const DrawerContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  flex: 1; /* Take remaining space after carousel */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  min-height: 0;
  width: 100%; /* Use full width within container */
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

export const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  overflow: visible; /* Allow buttons to show outside grid */
  min-width: 0;
  position: relative;
  align-items: center;
`;

export const GridAndPanelContainer = styled.div`
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: visible; /* Allow buttons to show outside */
`;

export const GridContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  overflow: visible;
  flex: 1;
  height: 100%;
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  width: 100%;
  position: static;
  left: auto;
  top: auto;
  z-index: 20;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

export const GridWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  overflow: visible; /* Allow action buttons to show outside */
  position: relative; /* For positioning action buttons */
  box-sizing: border-box;
`;

export const GridBoundingBox = styled.div`
  /* Unified bounding box using explicit width and height */
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  background: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.cols}, ${props => props.cellSize}px);
  grid-template-rows: repeat(${props => props.rows}, ${props => props.cellSize}px);
  gap: 0px;
  background: rgba(226, 232, 240, 0.1); /* Make background more transparent */
  padding: 0px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-top: 1px solid rgba(226, 232, 240, 0.3);
  border-left: 1px solid rgba(226, 232, 240, 0.3);
  box-sizing: border-box;
  
  canvas {
    width: 100% !important;
    height: 100% !important;
    min-width: unset !important;
  }
`;

export const GridCell = styled.div`
  background: rgba(248, 250, 252, 0.1); /* Make background more transparent */
  width: ${props => props.cellSize}px;
  height: ${props => props.cellSize}px;
  position: relative;
  pointer-events: none; /* Don't interfere with drag and drop */
  box-sizing: border-box;
  
  /* Create borders without overlapping - only right and bottom borders */
  border-right: 1px solid rgba(226, 232, 240, 0.3);
  border-bottom: 1px solid rgba(226, 232, 240, 0.3);
  
  /* Emphasis borders every 42mm (every 2 cells) */
  border-top: ${props => props.hasTopEmphasis ? '2px solid rgba(148, 163, 184, 0.7)' : 'none'};
  border-left: ${props => props.hasLeftEmphasis ? '2px solid rgba(148, 163, 184, 0.7)' : 'none'};
  
  &:hover {
    background: rgba(241, 245, 249, 0.2);
  }
`;

export const PlacedBin = styled.div`
  position: absolute;
  background: ${props => props.color || '#3b82f6'};
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s;
  z-index: 15;
  border: 2px solid ${props => {
    const color = props.color || '#3b82f6';
    // Convert hex to RGB and darken
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
    return `rgb(${r}, ${g}, ${b})`;
  }};
  opacity: ${props => props.isDragging ? 0.6 : 1};
  transform: ${props => props.isDragging ? 'scale(1.05)' : 'scale(1)'};
  pointer-events: auto;
  
  &:hover {
    transform: ${props => props.isDragging ? 'scale(1.05)' : 'scale(1.02)'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  ${props => props.selected && `
    border-color: #fbbf24;
    box-shadow: 0 0 0 2px #fbbf24;
  `}
`;

export const PrimaryButton = styled.button`
  padding: 0.625rem 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  width: 100%;
  font-size: 0.8rem;
  
  &:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

export const SecondaryButton = styled.button`
  padding: 0.625rem 1rem;
  background: white;
  color: #4f46e5;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  width: 100%;
  font-size: 0.8rem;
  
  &:hover {
    background: #4f46e5;
    color: white;
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

export const DrawingPreview = styled.div`
  position: absolute;
  border: 2px dashed #4f46e5;
  background: rgba(79, 70, 229, 0.1);
  pointer-events: none;
  z-index: 8;
  border-radius: 2px;
  
  ${props => props.error && `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  `}
`;

export const DrawingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  cursor: crosshair;
  pointer-events: auto;
`;

export const DropShadow = styled.div`
  position: absolute;
  border: 2px dashed #10b981;
  background: rgba(16, 185, 129, 0.15);
  pointer-events: none;
  z-index: 10;
  border-radius: 4px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
  
  ${props => props.error && `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  `}
`;

export const ErrorNotification = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fee2e2;
  color: #dc2626;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  z-index: 1000;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: centerFadeIn 0.3s ease-out;
  
  @keyframes centerFadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
`;

export const CenterErrorMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fef3c7;
  color: #92400e;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #fde68a;
  z-index: 1000;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: centerFadeIn 0.3s ease-out, centerFadeOut 0.3s ease-out 2.7s forwards;
  
  @keyframes centerFadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  @keyframes centerFadeOut {
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  }
`;

export const InstructionText = styled.p`
  text-align: center;
  margin-top: 0.125rem;
  margin-bottom: 0;
  color: #6b7280;
  font-size: 0.65rem;
  max-width: 100%;
  word-wrap: break-word;
  padding: 0 0.5rem;
  line-height: 1.1;
  height: 1rem;
  overflow: hidden;
`;

export const LayoutMainColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 20%) 1fr minmax(300px, 30%);
  gap: 1.25rem;
  width: 100%;
  flex: 1;
  overflow: hidden;
  align-items: start;
  position: relative;
  height: 100%;

  @media (max-width: 960px) {
    grid-template-columns: 18% 1fr 32%;
  }
  @media (max-width: 820px) {
    grid-template-columns: 1fr; /* fallback to single column */
    grid-auto-rows: max-content;
    height: auto;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: sticky;
  top: 0.5rem;
  align-self: start;
  height: fit-content;
`;

export const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  height: 100%;
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  height: 100%;
`;

export const ReviewButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0.75rem 0 1.25rem;
`;

export const ReviewButton = styled(PrimaryButton)`
  width: 70%;
  font-size: 0.9rem;
`;

export const Drawer3DWrapper = styled.div`
  flex: 0 0 auto;
  height: 32%;
  min-height: 180px;
  position: relative;
`;

export const BinOptionsAccordion = styled.div`
  flex: 1 1 auto;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: opacity 0.35s ease;
  opacity: ${props => props.open ? 1 : 0};
  pointer-events: ${props => props.open ? 'auto' : 'none'};
`;
