/**
 * Clean Google Apps Script for DrawerZen order logging and image uploads
 * This version handles both order submission and image uploads
 */

function doPost(e) {
  try {
    // Parse the JSON from the request body
    const data = JSON.parse(e.postData.contents);
    
    console.log('Received action:', data.action);
    
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
    
    // Handle the uploadImage action
    if (data.action === 'uploadImage') {
      const IMAGES_FOLDER_ID = '1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF';
      
      try {
        // Convert base64 to blob
        const imageBlob = Utilities.newBlob(
          Utilities.base64Decode(data.imageData),
          data.mimeType,
          data.fileName
        );
        
        // Upload to Google Drive
        const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
        const file = folder.createFile(imageBlob);
        
        // Make the file publicly viewable
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Get the public URL
        const imageUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
        
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: true, 
            imageUrl: imageUrl,
            fileId: file.getId(),
            message: 'Image uploaded successfully' 
          }))
          .setMimeType(ContentService.MimeType.JSON);
          
      } catch (error) {
        console.error('Error uploading image:', error);
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: false, 
            error: 'Failed to upload image: ' + error.toString() 
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
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