export const getSizingYarnReturnIssueDetails = (item) => {
  const remark = String(item?.remark || '');
  const returnedCones = remark.match(/Cones Returned:\s*([^|]+)/i)?.[1];
  const issued = remark.match(/Issued:\s*([\d.]+)\s*bags?\s*\/\s*([\d.]+)\s*cones/i);
  const issuedBags = Number(issued?.[1] || 0);

  return {
    availableCones: item?.conesReturned != null
      ? Number(item.conesReturned)
      : Number(returnedCones || 0),
    conePerBag: item?.conesPerBag != null
      ? Number(item.conesPerBag)
      : issuedBags > 0 ? Number(issued[2]) / issuedBags : null,
    sizingType: item?.itemType || remark.split(' | ')[0] || '',
  };
};

export const getYarnInwardOrigin = item => {
  const details = `${item?.type || ''} ${item?.billNo || ''} ${item?.remark2 || ''}`.toUpperCase();
  if (details.includes('DYED')) return 'dyeing';
  if (details.includes('REWOUND') || details.includes('REWIND')) return 'rewinding';
  return 'yarnIn';
};

export const sortIssueStockRows = rows => {
  const priority = { yarnIn: 0, sizing: 1, rewinding: 2, dyeing: 3 };
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => (priority[a.row.origin] ?? 0) - (priority[b.row.origin] ?? 0) || a.index - b.index)
    .map(({ row }) => row);
};
