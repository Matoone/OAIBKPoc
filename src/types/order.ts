export type Category = 
  | 'Menus'
  | 'Burgers'
  | 'Wraps & Salades'
  | 'Snacks'
  | 'Menus enfants'
  | 'Petites faims'
  | 'Desserts'
  | 'Sauces'
  | 'Boissons';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  category: Category;
}

export interface Order {
  items: OrderItem[];
  total: number;
}

export interface UpdateOrderTool {
  name: 'update_order';
  description: 'Met à jour la commande actuelle';
  parameters: {
    type: 'object';
    properties: {
      items: {
        type: 'array';
        items: {
          type: 'object';
          properties: {
            name: { type: 'string' };
            price: { type: 'number' };
            quantity: { type: 'number' };
            category: { 
              type: 'string';
              enum: [
                'Menus',
                'Burgers',
                'Wraps & Salades',
                'Snacks',
                'Menus enfants',
                'Petites faims',
                'Desserts',
                'Sauces',
                'Boissons'
              ];
            };
          };
          required: ['name', 'price', 'quantity', 'category'];
        };
      };
      total: { type: 'number' };
    };
    required: ['items', 'total'];
  };
}