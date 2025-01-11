import React from 'react';
import { Box, keyframes } from '@mui/material';

interface AudioIndicatorProps {
  isRecording: boolean;
}

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
`;

const AudioIndicator: React.FC<AudioIndicatorProps> = ({ isRecording }) => {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: isRecording ? '#B71C1C' : '#CCCCCC',
        animation: isRecording ? `${pulse} 1.5s ease-in-out infinite` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease'
      }}
    >
      <Box
        component="span"
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: 'white',
        }}
      />
    </Box>
  );
};

export default AudioIndicator;