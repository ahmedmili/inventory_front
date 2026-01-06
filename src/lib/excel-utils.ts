/**
 * Utility functions for Excel import/export
 */

// Dynamic import for xlsx to avoid SSR issues
let XLSX: any = null;

async function getXLSX() {
  if (!XLSX) {
    XLSX = await import('xlsx');
  }
  return XLSX;
}

export interface ProductExcelRow {
  name: string;
  sku?: string;
  description?: string;
  salePrice: string;
  minStock: string;
  supplierName?: string;
  initialQuantity?: string;
}

/**
 * Export products to Excel file
 */
export async function exportProductsToExcel(products: any[], filename: string = 'produits.xlsx'): Promise<void> {
  const xlsx = await getXLSX();
  
  // Prepare data
  const headers = ['Nom', 'Référence (SKU)', 'Description', 'Prix de vente', 'Seuil minimum', 'Fournisseur', 'Quantité initiale'];
  const rows = products.map((product) => {
    const stock = product.warehouseStock?.[0]?.quantity || 0;
    return [
      product.name || '',
      product.sku || '',
      product.description || '',
      Number(product.salePrice || 0),
      Number(product.minStock || 0),
      product.supplier?.name || '',
      Number(stock),
    ];
  });

  // Create workbook and worksheet
  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Nom
    { wch: 20 }, // SKU
    { wch: 40 }, // Description
    { wch: 15 }, // Prix
    { wch: 15 }, // Seuil
    { wch: 25 }, // Fournisseur
    { wch: 18 }, // Quantité
  ];

  // Create workbook
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Produits');

  // Download file
  xlsx.writeFile(workbook, filename);
}

/**
 * Parse Excel file and return product rows
 */
export async function parseExcelFile(file: File): Promise<ProductExcelRow[]> {
  const xlsx = await getXLSX();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          throw new Error('Le fichier Excel doit contenir au moins un en-tête et une ligne de données');
        }

        // Parse header
        const headers = jsonData[0].map((h: any) => String(h || '').trim());
        const headerMap: Record<string, number> = {};
        headers.forEach((header, index) => {
          headerMap[header] = index;
        });

        // Validate required headers
        if (!headerMap['Nom'] && !headerMap['nom'] && !headerMap['Name']) {
          throw new Error('Le fichier Excel doit contenir une colonne "Nom"');
        }

        const nameIndex = headerMap['Nom'] ?? headerMap['nom'] ?? headerMap['Name'] ?? 0;

        // Parse data rows
        const rows: ProductExcelRow[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every((cell: any) => !cell)) continue; // Skip empty rows

          const name = String(row[nameIndex] || '').trim();
          if (!name) continue; // Skip rows without name

          const getValue = (key: string, altKeys?: string[]): string => {
            const keys = [key, ...(altKeys || [])];
            for (const k of keys) {
              const index = headerMap[k];
              if (index !== undefined && row[index] !== undefined && row[index] !== null) {
                return String(row[index]).trim();
              }
            }
            return '';
          };

          rows.push({
            name,
            sku: getValue('Référence (SKU)', ['SKU', 'sku', 'Référence', 'reference']) || undefined,
            description: getValue('Description', ['description']) || undefined,
            salePrice: getValue('Prix de vente', ['Prix', 'prix', 'Sale Price', 'salePrice']) || '0',
            minStock: getValue('Seuil minimum', ['Seuil', 'seuil', 'Min Stock', 'minStock']) || '0',
            supplierName: getValue('Fournisseur', ['Supplier', 'supplier']) || undefined,
            initialQuantity: getValue('Quantité initiale', ['Quantité', 'quantité', 'Quantity', 'quantity']) || '0',
          });
        }

        resolve(rows);
      } catch (error: any) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier Excel'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export projects to Excel file
 */
export async function exportProjectsToExcel(projects: any[], filename: string = 'projets.xlsx'): Promise<void> {
  const xlsx = await getXLSX();
  
  // Prepare data
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
      Number(project._count?.members || project.members?.length || 0),
      Number(project._count?.products || project.products?.length || 0),
    ];
  });

  // Create workbook and worksheet
  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Nom
    { wch: 40 }, // Description
    { wch: 15 }, // Statut
    { wch: 15 }, // Date de début
    { wch: 15 }, // Date de fin
    { wch: 15 }, // Date de création
    { wch: 25 }, // Créé par
    { wch: 18 }, // Nombre de membres
    { wch: 18 }, // Nombre de produits
  ];

  // Create workbook
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Projets');

  // Download file
  xlsx.writeFile(workbook, filename);
}

