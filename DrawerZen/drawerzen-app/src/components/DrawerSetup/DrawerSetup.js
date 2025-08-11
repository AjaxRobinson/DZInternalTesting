import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import GridOverlay from '../GridOverlay/GridOverlay';
import FreeTransform from './FreeTransform';

const SetupContainer = styled.div`
  width: 100%;
  margin: 0 auto; /* Center the container */
  padding: ${props => props.expanded ? '1rem' : '1rem'}; /* Standard spacing when expanded */
  padding-top: ${props => props.expanded ? '1rem' : '1rem'}; /* Standard spacing from nav when expanded */
  display: flex;
  flex-direction: column;
  align-items: center;
  height: calc(100vh - 80px); /* Fixed height to viewport minus navbar */
  max-height: calc(100vh - 80px); /* Ensure it never exceeds viewport */
  box-sizing: border-box;
  overflow-y: auto; /* Allow scrolling only if absolutely necessary */
  transition: padding 0.6s ease-in-out;
  
  @media (max-width: 768px) {
    padding: ${props => props.expanded ? '0.75rem' : '0.75rem'};
    padding-top: ${props => props.expanded ? '0.75rem' : '0.75rem'};
    height: calc(100vh - 70px);
    max-height: calc(100vh - 70px);
  }
`;

const Card = styled.div`
  background: white;
  padding: ${props => props.expanded ? '1.5rem' : '2.5rem'}; /* Reduce padding when expanded */
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin-top: ${props => props.expanded ? '0' : '2rem'};
  width: 100%;
  max-width: ${props => props.expanded ? '95%' : '800px'};
  text-align: center;
  transition: all 0.6s ease-in-out;
  flex: 1; /* Allow it to grow and shrink within the container */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: ${props => props.expanded ? '1rem' : '1.5rem'};
    max-width: 100%;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 600px; /* Prevent inputs from becoming too wide on large screens */
  margin-left: auto;
  margin-right: auto;
  padding: 0 1rem; /* Standard padding on left and right */
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0; /* Remove side padding on mobile since card padding handles it */
    max-width: 100%;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  min-width: 0; /* Allows flex items to shrink below content size */
  width: 100%;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
  
  @media (max-width: 768px) {
    min-width: 120px; /* Ensure minimum usable width on mobile */
  }
`;

const UnitToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    max-width: 250px;
  }
`;

const UnitButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#4f46e5' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  margin-top: ${props => props.expanded ? '1rem' : '2rem'}; /* Reduce margin when expanded */
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0; /* Don't let it shrink */
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const VisualPreview = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
`;

const PreviewBox = styled.div`
  width: ${props => props.width}px;
  height: ${props => props.length}px;
  margin: 0 auto;
  background: white;
  border: 2px solid #4f46e5;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.875rem;
  transition: all 0.3s ease-in-out;
`;

// Define the animation using the keyframes helper
const waveAnimation = keyframes`
  0% { background-position: 200% 50%; }
  50% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const WavyPlaceholder = styled(PreviewBox)`
  background: linear-gradient(90deg, #f0f2f5, #e6e8ec, #f0f2f5);
  background-size: 200% 200%;
  animation: ${waveAnimation} 2s ease infinite; /* Apply the animation here */
  border-style: dashed;
  color: transparent;
`;

const ImageUpload = styled.input`
  margin-top: 1rem;
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
`;

const UploadSection = styled.div`
  margin-top: 2rem;
  text-align: center;
  padding: 0 1rem; /* Match the InputRow padding */
  
  @media (max-width: 768px) {
    padding: 0; /* Remove side padding on mobile */
  }
`;

const UploadLabel = styled.label`
  display: inline-block;
  padding: 1rem 2rem;
  background: #4f46e5;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  
  .desktop-text {
    display: inline;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  .mobile-text {
    display: none;
    
    @media (max-width: 768px) {
      display: inline;
    }
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PageTitle = styled.h1`
  text-align: center;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  opacity: ${props => props.visible ? 1 : 0};
  max-height: ${props => props.visible ? '200px' : '0'};
  overflow: hidden;
  transition: opacity 0.5s ease-in-out, max-height 0.5s ease-in-out, margin 0.5s ease-in-out;
  margin-bottom: ${props => props.visible ? '0.5rem' : '0'};
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PageSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;
  opacity: ${props => props.visible ? 1 : 0};
  max-height: ${props => props.visible ? '100px' : '0'};
  overflow: hidden;
  transition: opacity 0.5s ease-in-out 0.1s, max-height 0.5s ease-in-out 0.1s, margin 0.5s ease-in-out 0.1s;
  margin-bottom: ${props => props.visible ? '2rem' : '0'};
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const GridOverlayContainer = styled.div`
  margin-top: ${props => props.expanded ? '1rem' : '2rem'}; /* Reduce margin when expanded */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  max-width: ${props => props.expanded ? '90vw' : '100%'};
  flex: 1; /* Allow it to grow within available space */
  min-height: 0; /* Allow it to shrink */
  transition: all 0.6s ease-in-out;
`;

const ImageWithGrid = styled.div`
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: ${props => props.expanded ? '45vh' : '300px'}; /* More conservative height when expanded */
  border: 2px solid #4f46e5;
  border-radius: 8px;
  overflow: hidden;
  transition: max-height 0.6s ease-in-out;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const DrawerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

const GridOverlayOld = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(79, 70, 229, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(79, 70, 229, 0.3) 1px, transparent 1px);
  background-size: ${props => props.cellSize}px ${props => props.cellSize}px;
`;

const CropContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.expanded ? '45vh' : '400px'};
  max-width: 100%;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  overflow: hidden;
  transition: height 0.6s ease-in-out;
`;

const CropControls = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const CropButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #4f46e5;
    color: white;
    
    &:hover {
      background: #4338ca;
    }
  }
  
  &.secondary {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: ${props => props.expanded ? '45vh' : '300px'};
  border: 2px solid #4f46e5;
  border-radius: 8px;
  overflow: hidden;
  transition: max-height 0.6s ease-in-out;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const RecropButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(79, 70, 229, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(67, 56, 202, 0.9);
  }
`;

const GridInfo = styled.div`
  margin-top: ${props => props.expanded ? '0.5rem' : '1rem'};
  padding: ${props => props.expanded ? '0.75rem' : '1rem'};
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
  transition: all 0.6s ease-in-out;
  
  .grid-stats {
    display: flex;
    justify-content: center;
    gap: ${props => props.expanded ? '1rem' : '2rem'};
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-value {
    font-weight: 600;
    color: #4f46e5;
    font-size: ${props => props.expanded ? '1rem' : '1.1rem'};
  }
  
  .stat-label {
    font-size: ${props => props.expanded ? '0.8rem' : '0.875rem'};
    color: #6b7280;
  }
`;

export default function DrawerSetup({ onComplete, initialDimensions, dataManager }) {
  const navigate = useNavigate();
  const [unit, setUnit] = useState('mm');
  const [dimensions, setDimensions] = useState({
    width: initialDimensions?.width || '',
    length: initialDimensions?.length || '',
    height: initialDimensions?.height || ''
  });
  // Store original uploaded image (client-side)
  const [image, setImage] = useState(dataManager?.appData?.uploadedImage?.url || null);
  const [originalImage, setOriginalImage] = useState(dataManager?.appData?.uploadedImage?.url || null);
  const [uploading, setUploading] = useState(false);
  // Store transform (corner positions)
  const [transform, setTransform] = useState(dataManager?.appData?.uploadedImage?.transform || null);
  // Store 4-corner deltas relative to grid center
  const [cornerDeltas, setCornerDeltas] = useState(null);
  // Store cropped image (client-side)
  const [croppedImage, setCroppedImage] = useState(null);
  // Store exported/cropped underlay image (for LayoutDesigner)
  const [underlayImage, setUnderlayImage] = useState(null);
  // Store rotated image
  const [rotatedImage, setRotatedImage] = useState(null);
  
  // Window resize handler to update orientation
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-calculation when viewport orientation changes
      setDimensions(prev => ({ ...prev }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track portrait mode for mobile continue button
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setDimensions(prev => ({ ...prev }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug logging
  console.log('DrawerSetup render - image state:', {
    image: !!image,
    imageLength: image?.length,
    dimensions: dimensions,
    uploading,
    transform: !!transform
  });

  // Clear image state when dataManager clears data
  useEffect(() => {
    if (!dataManager?.appData?.uploadedImage?.url) {
      setImage(null);
      setTransform(null);
    }
  }, [dataManager?.appData?.uploadedImage?.url]);

  // Clear dimensions when dataManager clears data
  useEffect(() => {
    if (!dataManager?.appData?.drawerDimensions) {
      setDimensions({
        width: '',
        length: '',
        height: ''
      });
    }
  }, [dataManager?.appData?.drawerDimensions]);

  // Determine if container should be expanded (both image and dimensions are present)
  const isExpanded = image && dimensions.width && dimensions.length;
  
  // Show headers only when not expanded
  const showHeaders = !isExpanded;

  const handleImageUpload = (e) => {
    setRotatedImage(null); // Reset any previous rotation
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setImage(imageUrl);
        setOriginalImage(imageUrl);
        setCroppedImage(null);
        setTransform(null);
        setCornerDeltas(null);
        setUploading(false);
        if (dataManager) {
          dataManager.updateUploadedImage({ url: imageUrl });
        }
      };
      reader.onerror = () => {
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save transform and calculate 4-corner deltas relative to grid center
  const handleTransformChange = (newTransform, gridCenter) => {
    setTransform(newTransform);
    if (newTransform && gridCenter) {
      // Calculate deltas for each corner
      const deltas = {
        topLeft: {
          x: newTransform.topLeft.x - gridCenter.x,
          y: newTransform.topLeft.y - gridCenter.y
        },
        topRight: {
          x: newTransform.topRight.x - gridCenter.x,
          y: newTransform.topRight.y - gridCenter.y
        },
        bottomLeft: {
          x: newTransform.bottomLeft.x - gridCenter.x,
          y: newTransform.bottomLeft.y - gridCenter.y
        },
        bottomRight: {
          x: newTransform.bottomRight.x - gridCenter.x,
          y: newTransform.bottomRight.y - gridCenter.y
        }
      };
      setCornerDeltas(deltas);
    }
    if (dataManager) {
      dataManager.updateUploadedImage({ url: image, transform: newTransform });
    }
  };
  // Callback to receive the cropped/distorted image from FreeTransform
  const handleExportImage = (dataURL) => {
    setCroppedImage(dataURL);
    setUnderlayImage(dataURL);
    if (dataManager) {
      dataManager.updateUploadedImage({ ...dataManager.appData.uploadedImage, underlay: dataURL });
    }
  };

  const handleDimensionChange = (field, value) => {
    // Only update value, do not enforce min/max here
    const newDimensions = { ...dimensions, [field]: value };
    setDimensions(newDimensions);
    // Update data manager if available and all dimensions are filled
    if (dataManager && newDimensions.width && newDimensions.length && newDimensions.height) {
      dataManager.updateDrawerDimensions({
        width: parseFloat(newDimensions.width),
        length: parseFloat(newDimensions.length),
        height: parseFloat(newDimensions.height)
      });
    }
  };

  const handleSubmit = async () => {
    // Use the raw user input dimensions, not the viewport-oriented version
    let rawDimensions;
    if (unit === 'inches') {
      rawDimensions = {
        width: parseFloat(dimensions.width) * 25.4,
        length: parseFloat(dimensions.length) * 25.4,
        height: parseFloat(dimensions.height) * 25.4,
        unit: 'mm',
      };
    } else {
      rawDimensions = {
        width: parseFloat(dimensions.width),
        length: parseFloat(dimensions.length),
        height: parseFloat(dimensions.height),
        unit: 'mm',
      };
    }
    // Upload original image to Google Drive
    if (dataManager && originalImage) {
      setUploading(true);
      try {
        await dataManager.uploadImageToDrive(originalImage);
      } catch (error) {
        // Continue anyway with local image
      } finally {
        setUploading(false);
      }
    }
    // Save corner deltas to spreadsheet
    if (dataManager && cornerDeltas) {
      await dataManager.saveCornerDeltasToSheet(cornerDeltas);
    }
    // Pass the raw user dimensions to the layout page
    onComplete({
      drawerDimensions: rawDimensions,
      underlayImage: croppedImage,
      transform,
      cornerDeltas
    });
    navigate('/layout');
  };

  // Rotate image 90 degrees clockwise
  const handleRotateImage = () => {
    const src = rotatedImage || image;
    if (!src) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      const rotatedDataUrl = canvas.toDataURL();
      setRotatedImage(rotatedDataUrl);
      setImage(rotatedDataUrl);
      if (dataManager) {
        dataManager.updateUploadedImage({
          url: rotatedDataUrl
        });
      }
    };
    img.src = src;
  };

  const isValid = dimensions.width && dimensions.length && dimensions.height && image;

  // Only allow submit if the cropped/distorted image is available
  const canSubmit = isValid && !!croppedImage && !uploading;
  // Calculate grid dimensions and preview settings with viewport-aware orientation
  const getDrawerDimensionsInMM = () => {
    if (!dimensions.width || !dimensions.length) return { width: 0, length: 0 };
    
    let width, length;
    if (unit === 'inches') {
      width = parseFloat(dimensions.width) * 25.4;
      length = parseFloat(dimensions.length) * 25.4;
    } else {
      width = parseFloat(dimensions.width);
      length = parseFloat(dimensions.length);
    }
    
    // Determine viewport orientation
    const isViewportLandscape = window.innerWidth > window.innerHeight;
    
    // Arrange dimensions based on viewport orientation
    if (isViewportLandscape) {
      // Landscape viewport: put larger dimension on X-axis (width)
      return {
        width: Math.max(width, length),
        length: Math.min(width, length)
      };
    } else {
      // Portrait viewport: put larger dimension on Y-axis (length)
      return {
        width: Math.min(width, length),
        length: Math.max(width, length)
      };
    }
  };

  const drawerMM = getDrawerDimensionsInMM();
  const gridCols = drawerMM.width > 0 ? Math.floor(drawerMM.width / 21) : 0;
  const gridRows = drawerMM.length > 0 ? Math.floor(drawerMM.length / 21) : 0;
  
  // Calculate cell size for display - considering both width and height constraints
  const maxDisplayWidth = isExpanded ? Math.min(600, window.innerWidth * 0.75) : 400;
  const maxDisplayHeight = isExpanded ? Math.min(300, window.innerHeight * 0.4) : 300; // Conservative height
  const aspectRatio = drawerMM.width / drawerMM.length;
  let displayWidth, displayHeight;
  
  if (aspectRatio > 1) {
    displayWidth = Math.min(maxDisplayWidth, drawerMM.width * (isExpanded ? 0.8 : 0.5));
    displayHeight = displayWidth / aspectRatio;
    // Ensure height doesn't exceed our max
    if (displayHeight > maxDisplayHeight) {
      displayHeight = maxDisplayHeight;
      displayWidth = displayHeight * aspectRatio;
    }
  } else {
    displayHeight = Math.min(maxDisplayHeight, drawerMM.length * (isExpanded ? 0.8 : 0.5));
    displayWidth = displayHeight * aspectRatio;
    // Ensure width doesn't exceed our max
    if (displayWidth > maxDisplayWidth) {
      displayWidth = maxDisplayWidth;
      displayHeight = displayWidth / aspectRatio;
    }
  }
  
  const cellSizeX = displayWidth / gridCols;
  const cellSizeY = displayHeight / gridRows;

  return (
    <SetupContainer expanded={isExpanded}>
      <PageTitle visible={showHeaders}>Setup Your Drawer</PageTitle>
      <PageSubtitle visible={showHeaders}>Provide dimensions and upload a photo of your drawer.</PageSubtitle>

      <Card expanded={isExpanded}>
        <UnitToggle>
          <UnitButton 
            active={unit === 'mm'} 
            onClick={() => setUnit('mm')}
          >
            Millimeters
          </UnitButton>
          <UnitButton 
            active={unit === 'inches'} 
            onClick={() => setUnit('inches')}
          >
            Inches
          </UnitButton>
        </UnitToggle>

        <InputRow>
          <InputGroup>
            <Label>Width ({unit})</Label>
            <Input
              type="number"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              onBlur={(e) => {
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  if (unit === 'mm') {
                    val = Math.max(42, Math.min(1000, val));
                  } else {
                    const minInches = 42 / 25.4;
                    const maxInches = 1000 / 25.4;
                    val = Math.max(minInches, Math.min(maxInches, val));
                  }
                  handleDimensionChange('width', val);
                }
              }}
              placeholder={unit === 'mm' ? 'e.g. 400' : 'e.g. 15.7'}
              min={unit === 'mm' ? '21' : '0.83'}
              step={unit === 'mm' ? '1' : '0.1'}
            />
          </InputGroup>

          <InputGroup>
            <Label>Length ({unit})</Label>
            <Input
              type="number"
              value={dimensions.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              onBlur={(e) => {
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  if (unit === 'mm') {
                    val = Math.max(42, Math.min(1000, val));
                  } else {
                    const minInches = 42 / 25.4;
                    const maxInches = 1000 / 25.4;
                    val = Math.max(minInches, Math.min(maxInches, val));
                  }
                  handleDimensionChange('length', val);
                }
              }}
              placeholder={unit === 'mm' ? 'e.g. 300' : 'e.g. 11.8'}
              min={unit === 'mm' ? '21' : '0.83'}
              step={unit === 'mm' ? '1' : '0.1'}
            />
          </InputGroup>

          <InputGroup>
            <Label>Height ({unit})</Label>
            <Input
              type="number"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              onBlur={(e) => {
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  if (unit === 'mm') {
                    val = Math.max(20, Math.min(300, val));
                  } else {
                    const minInches = 20 / 25.4;
                    const maxInches = 300 / 25.4;
                    val = Math.max(minInches, Math.min(maxInches, val));
                  }
                  handleDimensionChange('height', val);
                }
              }}
              placeholder={unit === 'mm' ? 'e.g. 50' : 'e.g. 2.0'}
              min="0"
              step={unit === 'mm' ? '1' : '0.1'}
            />
          </InputGroup>
        </InputRow>

        <UploadSection>
          <UploadLabel htmlFor="image-upload">
            <span className="desktop-text">{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            <span className="mobile-text">Upload Photo or Take Picture</span>
          </UploadLabel>
          <HiddenFileInput
            id="image-upload"
            type="file"
            accept="image/*"
            capture="environment" /* Use rear camera on mobile */
            onChange={handleImageUpload}
          />
        </UploadSection>

        {/* Simple image preview for debugging when dimensions not set */}
        {image && !dimensions.width && (
          <div style={{padding: '1rem', border: '1px solid #ccc', margin: '1rem 0', textAlign: 'center'}}>
            <p>Image uploaded but dimensions not set:</p>
            <img src={image} alt="Uploaded" style={{maxWidth: '200px', maxHeight: '200px'}} />
            <p style={{fontSize: '0.9rem', color: '#666'}}>Set drawer dimensions above to enable transform tools</p>
          </div>
        )}

        {/* Free Transform Tool Interface */}
        {image && dimensions.width && dimensions.length && (
          <div style={{width: '100%', maxWidth: '900px', margin: '1rem auto'}}>
            <div style={{marginBottom: '1rem', textAlign: 'center'}}>
              <h3>Position Your Drawer Image</h3>
              <p style={{color: '#666', fontSize: '0.9rem', margin: '0.5rem 0'}}>
                Drag the blue corners to distort your image. The red border shows the final crop area.
              </p>
              <button type="button" style={{margin: '0.5rem 0', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: 500, cursor: 'pointer'}} onClick={handleRotateImage}>
                Rotate Image 90°
              </button>
            </div>
            <FreeTransform
              image={image}
              containerWidth={700}
              containerHeight={Math.round(700 * (drawerMM.length / drawerMM.width))}
              onTransformChange={handleTransformChange}
              gridCols={gridCols}
              gridRows={gridRows}
              onExportImage={handleExportImage}
            />
            {/* Grid info */}
            <div style={{padding: '1rem', background: '#f9f9f9', fontSize: '0.9rem', marginTop: '1rem', borderRadius: '8px'}}>
              <div style={{fontWeight: 'bold', marginBottom: '0.5rem'}}>Drawer Specifications:</div>
              <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
                <div>
                  <strong>{gridCols} × {gridRows}</strong>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>21mm Grid Cells</div>
                </div>
                <div>
                  <strong>{(drawerMM.width / 1000).toFixed(2)}m × {(drawerMM.length / 1000).toFixed(2)}m</strong>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>Actual Size</div>
                </div>
                <div>
                  <strong>{(drawerMM.width * drawerMM.length / 1000000).toFixed(3)}m²</strong>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>Area</div>
                </div>
              </div>
              <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: '#666'}}>
                The grid represents 21mm cells for precise bin placement. Your image will be cropped to the red border area.
              </div>
            </div>
          </div>
        )}

        <SubmitButton expanded={isExpanded} onClick={handleSubmit} disabled={!canSubmit}>
          {uploading ? 'Processing...' : (!underlayImage ? 'Preparing Image...' : 'Continue to Layout')}
        </SubmitButton>

        {/* Continue to Layout Button - always visible in portrait mode or on mobile */}
        {(isPortrait || window.innerWidth < 768) && (
          <SubmitButton expanded={isExpanded} onClick={handleSubmit} disabled={!canSubmit}>
            {uploading ? 'Processing...' : (!underlayImage ? 'Preparing Image...' : 'Continue to Layout')}
          </SubmitButton>
        )}
      </Card>
    </SetupContainer>
  );
}