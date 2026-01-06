/**
 * Utility functions for CSV import/export
 */

export interface ProductCSVRow {
  name: string;
  sku?: string;
  description?: string;
  salePrice: string;
  minStock: string;
  supplierName?: string;
  initialQuantity?: string;
}

/**
 * Convert products array to CSV string
 */
export function exportProductsToCSV(products: any[]): string {
  const headers = ['Nom', 'Référence (SKU)', 'Description', 'Prix de vente', 'Seuil minimum', 'Fournisseur', 'Quantité initiale'];
  const rows = products.map((product) => {
    const stock = product.warehouseStock?.[0]?.quantity || 0;
    return [
      product.name || '',
      product.sku || '',
      product.description || '',
      String(product.salePrice || 0),
      String(product.minStock || 0),
      product.supplier?.name || '',
      String(stock),
    ];
  });

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ];

  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file content
 */
export function parseCSV(csvContent: string): ProductCSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = ['Nom', 'Référence (SKU)', 'Description', 'Prix de vente', 'Seuil minimum', 'Fournisseur', 'Quantité initiale'];
  
  // Map headers to indices
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header.trim()] = index;
  });

  // Validate required headers
  if (!headerMap['Nom']) {
    throw new Error('Le fichier CSV doit contenir une colonne "Nom"');
  }

  // Parse data rows
  const rows: ProductCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue; // Skip empty rows

    const row: ProductCSVRow = {
      name: values[headerMap['Nom']]?.trim() || '',
      sku: values[headerMap['Référence (SKU)']]?.trim() || undefined,
      description: values[headerMap['Description']]?.trim() || undefined,
      salePrice: values[headerMap['Prix de vente']]?.trim() || '0',
      minStock: values[headerMap['Seuil minimum']]?.trim() || '0',
      supplierName: values[headerMap['Fournisseur']]?.trim() || undefined,
      initialQuantity: values[headerMap['Quantité initiale']]?.trim() || '0',
    };

    if (!row.name) {
      throw new Error(`Ligne ${i + 1}: Le nom du produit est requis`);
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);
  return values;
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Convert projects array to CSV string
 */
export function exportProjectsToCSV(projects: any[]): string {
  const headers = ['Nom', 'Description', 'Statut', 'Date de début', 'Date de fin', 'Date de création', 'Créé par', 'Nombre de membres', 'Nombre de produits'];
  const rows = projects.map((project) => {
    return [
      project.name || '',
      project.description || '',
      project.status || '',
      project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '',
      project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '',
      project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : '',
      project.createdBy ? `${project.createdBy.firstName} ${project.createdBy.lastName}` : '',
      String(project._count?.members || project.members?.length || 0),
      String(project._count?.products || project.products?.length || 0),
    ];
  });

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ];

  return csvRows.join('\n');
}

