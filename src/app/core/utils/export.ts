export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (val: string | number) => {
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(','))
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
