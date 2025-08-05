import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

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
  overflow: hidden; /* Prevent content from spilling out */
  
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

const GridOverlay = styled.div`
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
  const [image, setImage] = useState(dataManager?.appData?.uploadedImage?.url || null);
  const [uploading, setUploading] = useState(false);

  // Determine if container should be expanded (both image and dimensions are present)
  const isExpanded = image && dimensions.width && dimensions.length;
  
  // Show headers only when not expanded
  const showHeaders = !isExpanded;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        // First show preview
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result);
        reader.readAsDataURL(file);

        // Upload to Google Drive if dataManager is available
        if (dataManager) {
          const result = await dataManager.uploadImage(file);
          if (result.success) {
            setImage(result.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        // Keep the preview even if upload fails
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDimensionChange = (field, value) => {
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

  const handleSubmit = () => {
    let dimensionsInMM;
    
    if (unit === 'inches') {
      dimensionsInMM = {
        width: parseFloat(dimensions.width) * 25.4,
        length: parseFloat(dimensions.length) * 25.4,
        height: parseFloat(dimensions.height) * 25.4,
        unit: 'mm'
      };
    } else {
      dimensionsInMM = {
        width: parseFloat(dimensions.width),
        length: parseFloat(dimensions.length),
        height: parseFloat(dimensions.height),
        unit: 'mm'
      };
    }

    if (
      dimensionsInMM.width < 21 ||
      dimensionsInMM.length < 21 ||
      dimensionsInMM.height < 0
    ) {
      alert('Drawer dimensions must be at least 21mm wide and deep.');
      return;
    }

    onComplete({ ...dimensionsInMM, image });
    navigate('/layout');
  };

  const isValid = dimensions.width && dimensions.length && dimensions.height && image;

  // Calculate grid dimensions and preview settings
  const getDrawerDimensionsInMM = () => {
    if (!dimensions.width || !dimensions.length) return { width: 0, length: 0 };
    
    if (unit === 'inches') {
      return {
        width: parseFloat(dimensions.width) * 25.4,
        length: parseFloat(dimensions.length) * 25.4
      };
    }
    return {
      width: parseFloat(dimensions.width),
      length: parseFloat(dimensions.length)
    };
  };

  const drawerMM = getDrawerDimensionsInMM();
  const gridCols = Math.floor(drawerMM.width / 21);
  const gridRows = Math.floor(drawerMM.length / 21);
  
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

        {image && dimensions.width && dimensions.length && (
          <GridOverlayContainer expanded={isExpanded}>
            <ImageWithGrid expanded={isExpanded}>
              <DrawerImage 
                src={image} 
                alt="Drawer"
                style={{
                  width: displayWidth,
                  height: displayHeight
                }}
              />
              <GridOverlay 
                cellSize={cellSizeX}
                style={{
                  backgroundSize: `${cellSizeX}px ${cellSizeY}px`
                }}
              />
            </ImageWithGrid>
            <GridInfo expanded={isExpanded}>
              <div>Grid overlay shows 42mm cells. Bins can be placed with 21mm precision.</div>
              <div className="grid-stats">
                <div className="stat">
                  <div className="stat-value">{gridCols} × {gridRows}</div>
                  <div className="stat-label">42mm Grid Cells</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{(drawerMM.width / 1000).toFixed(2)}m × {(drawerMM.length / 1000).toFixed(2)}m</div>
                  <div className="stat-label">Actual Size</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{(drawerMM.width * drawerMM.length / 1000000).toFixed(3)}m²</div>
                  <div className="stat-label">Area</div>
                </div>
              </div>
            </GridInfo>
          </GridOverlayContainer>
        )}

        <SubmitButton expanded={isExpanded} onClick={handleSubmit} disabled={!isValid}>
          Continue to Layout
        </SubmitButton>
      </Card>
    </SetupContainer>
  );
}