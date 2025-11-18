import { apiClient } from './api';

/**
 * Download PDF for a purchase order
 */
export async function downloadPurchaseOrderPDF(orderId: string): Promise<void> {
  try {
    const response = await apiClient.get(`/purchases/${orderId}/pdf`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `purchase-order-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
}

/**
 * Download PDF for a sales order
 */
export async function downloadSalesOrderPDF(orderId: string): Promise<void> {
  try {
    const response = await apiClient.get(`/sales/${orderId}/pdf`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales-invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
}

