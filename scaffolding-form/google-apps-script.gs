function doPost(e) {
  try {
    const content = e.postData && e.postData.contents;
    if (!content) throw new Error('No POST body found');

    const data = JSON.parse(content);
    const spreadsheetId = '1OK5nk75VUkYZldeATgUJGHJxjpoZxwR8xHBdhtJMGNo';
    const sheetName = 'Sheet1';
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Phone', 'Food', 'Tray', 'Quantity', 'Total', 'Pickup Date', 'Pickup Time']);
    }

    if (data.action === 'summary') {
      return ContentService
        .createTextOutput(JSON.stringify({ summary: getSummaryForDate(sheet, data.date) }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.name || '',
      data.phone || '',
      data.food || '',
      data.tray || '',
      data.qty || '',
      data.total || '',
      data.pickupDate || '',
      data.pickupTime || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Order saved successfully.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSummaryForDate(sheet, targetDate) {
  const rows = sheet.getDataRange().getValues();
  const summaryRows = [];
  const target = new Date(targetDate);

  rows.forEach((row, index) => {
    if (index === 0) return; // skip header row if present
    const [date, name, phone, food, tray, qty, total, pickupDate, pickupTime] = row;
    if (!pickupDate) return;

    const rowDate = new Date(pickupDate);
    if (rowDate.toDateString() === target.toDateString()) {
      summaryRows.push(`Name: ${name}, Phone: ${phone}, Item: ${food}, Tray: ${tray}, Qty: ${qty}, Total: ${total}, Pickup: ${pickupDate} ${pickupTime}`);
    }
  });

  return summaryRows.join('\n') || 'No orders found for this date.';
}
