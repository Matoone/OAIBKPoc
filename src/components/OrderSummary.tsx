import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Order, Category } from '../types/order';

interface OrderSummaryProps {
  order: Order;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  // Grouper les items par catégorie
  const itemsByCategory = order.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<Category, typeof order.items>);

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography variant="h2" component="h2" gutterBottom>
        Votre commande
      </Typography>
      
      {Object.entries(itemsByCategory).map(([category, items]) => (
        <Box key={category} sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ 
            fontSize: '1.5rem', 
            fontWeight: 700,
            mb: 2 
          }}>
            {category}
          </Typography>
          
          {items.map((item, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mb: 1,
                pb: 1,
                borderBottom: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography>{item.quantity}</Typography>
                <Typography>{item.name}</Typography>
              </Box>
              <Typography>{item.price.toFixed(2)} €</Typography>
            </Box>
          ))}
        </Box>
      ))}
      
      <Box 
        sx={{ 
          mt: 4,
          pt: 2,
          borderTop: '2px solid #502314',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h3" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Total
        </Typography>
        <Typography variant="h3" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {order.total.toFixed(2)} €
        </Typography>
      </Box>
    </Paper>
  );
};

export default OrderSummary;