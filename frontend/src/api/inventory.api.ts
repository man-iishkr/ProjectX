import api from './axios';

// Products
export const getProducts = async () => {
    const { data } = await api.get('/inventory/products');
    return data;
};

export const createProduct = async (productData: any) => {
    const { data } = await api.post('/inventory/products', productData);
    return data;
};

export const updateProduct = async (id: string, productData: any) => {
    const { data } = await api.put(`/inventory/products/${id}`, productData);
    return data;
};

// Inventory / Stock
export const getInventory = async (stockistId?: string) => {
    const query = stockistId ? `?stockistId=${stockistId}` : '';
    const { data } = await api.get(`/inventory/stock${query}`);
    return data;
};

export const updateStock = async (stockData: any) => {
    // stockData: { stockistId, productId, stockIn, stockOut }
    const { data } = await api.post('/inventory/stock', stockData);
    return data;
};
