import React from 'react';
import { Button } from '@mui/material';

interface StartButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const StartButton: React.FC<StartButtonProps> = ({ onClick, disabled }) => {
  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={onClick}
      disabled={disabled}
      sx={{
        py: 2,
        px: 4,
        fontSize: '1.2rem'
      }}
    >
      Commencer
    </Button>
  );
};

export default StartButton;