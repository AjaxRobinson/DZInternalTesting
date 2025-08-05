import React from 'react';
import { 
  PrimaryButton, 
  SecondaryButton, 
  ActionButtonsContainer 
} from '../LayoutDesigner.styles';

const ActionButtons = ({ 
  onAutoSort, 
  onGenerateBins, 
  onReset, 
  onReview, 
  hasPlacedBins 
}) => {
  return (
    <ActionButtonsContainer>
      <PrimaryButton onClick={onAutoSort} disabled={!hasPlacedBins}>
        Auto Sort
      </PrimaryButton>
      <PrimaryButton onClick={onGenerateBins}>
        Generate Bins
      </PrimaryButton>
      <SecondaryButton onClick={onReset} disabled={!hasPlacedBins}>
        Reset
      </SecondaryButton>
      <PrimaryButton onClick={onReview} disabled={!hasPlacedBins}>
        Review Order
      </PrimaryButton>
    </ActionButtonsContainer>
  );
};

export default ActionButtons;
