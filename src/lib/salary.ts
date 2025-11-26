// src/lib/salary.ts

/**
 * Convierte salary_range (string) a número.
 * Soporta:
 * - "$25.000"
 * - "25000"
 * - "25.000 CLP"
 * - "20.000 - 30.000"
 * - "$20.000 - $25.000"
 * - "20k - 30k"
 * - "20k"
 */
export function parseSalaryRange(value?: string | null): number {
  if (!value) return 0;

  let v = value.toString().trim().toLowerCase();

  // Reemplazar "k" por mil (20k = 20000)
  v = v.replace(/(\d+)\s*k\b/g, (_, num) => `${Number(num) * 1000}`);

  // Si es un rango "20.000 - 25.000"
  if (v.includes("-")) {
    const parts = v.split("-");
    const nums = parts.map((p) => extractNumber(p));
    const valid = nums.filter((n) => n > 0);
    if (valid.length === 0) return 0;

    // Promedio del rango
    return Math.round(
      valid.reduce((a, b) => a + b, 0) / valid.length
    );
  }

  // Caso simple: un valor numérico
  return extractNumber(v);
}

/**
 * Extrae un número desde una string con símbolos, puntos, comas, CLP, $, etc.
 */
function extractNumber(str: string): number {
  if (!str) return 0;

  // Remover todo excepto números
  const cleaned = str.replace(/[^0-9]/g, "");
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}
