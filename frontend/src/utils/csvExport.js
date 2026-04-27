// Helper function to convert array of objects to CSV string
export const convertToCSV = (data, columns) => {
  // Create header row
  const header = columns.map(col => col.label).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      // Handle special cases (dates, commas, quotes)
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      if (col.key === 'createdAt' || col.key === 'lastLogin') {
        value = value ? new Date(value).toLocaleString() : '';
      }
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
};

// Function to download CSV file
export const downloadCSV = (csvString, filename) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

