// src/lib/exportExcel.ts
import * as XLSX from "xlsx";

/**
 * Exporta un arreglo de objetos a un archivo Excel.
 * @param rows Array de objetos tipo {campo: valor}
 * @param filename Nombre del archivo "archivo.xlsx"
 */
export function exportToExcel(rows: any[], filename: string) {
  if (!rows || rows.length === 0) {
    console.error("No hay datos para exportar");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "data");

  XLSX.writeFile(workbook, filename);
}
