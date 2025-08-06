/**
 * Clean Google Apps Script for DrawerZen order logging
 * This version only handles order submission to avoid conflicts
 */

function doPost(e) {
  try {
    // Parse the JSON from the request body
    const data = JSON.parse(e.postData.contents);
    
    console.log('Received data:', data);
    
    // Handle the appendOrderLog action
    if (data.action === 'appendOrderLog') {
      const SPREADSHEET_ID = '1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE';
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
      
      // Add headers if this is the first row
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Timestamp',
          'Session ID',
          'Email',
          'First Name',
          'Last Name',
          'Phone',
          'Address',
          'Apartment',
          'City',
          'State',
          'Zip Code',
          'Country',
          'Drawer Width',
          'Drawer Length',
          'Drawer Height',
          'Bin Count',
          'Total Price',
          'Layout JSON',
          'Image URL',
          'Status'
        ]);
      }
      
      sheet.appendRow(data.rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Order logged successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action: ' + data.action }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      message: 'DrawerZen Order API is running', 
      timestamp: new Date().toISOString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}