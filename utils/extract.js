import xlsx from 'xlsx';

export const extractDataFromExcel = (buffer, fieldMappings) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // raw rows, index-based

  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
      continue;
    }

    const obj = {};

    for (const [key, index] of Object.entries(fieldMappings)) {
      obj[key] = row[index] ?? null; // fallback to null if missing
    }

    data.push(obj);
  }

  return data;
};
