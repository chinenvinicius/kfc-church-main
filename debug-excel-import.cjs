const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function debugExcelImport() {
  const filepath = path.join(process.cwd(), 'server/excel/attendance_2025-05-24.xlsx');
  
  console.log('🔍 Debugging Excel Import...');
  console.log('File path:', filepath);
  console.log('File exists:', fs.existsSync(filepath));
  
  if (!fs.existsSync(filepath)) {
    console.error('❌ File does not exist!');
    return;
  }
  
  try {
    console.log('📖 Attempting to read Excel file...');
    const workbook = XLSX.readFile(filepath);
    console.log('✅ Excel file read successfully');
    console.log('Sheet names:', workbook.SheetNames);
    
    if (workbook.SheetNames.length === 0) {
      console.error('❌ No sheets found in workbook');
      return;
    }
    
    const sheetName = workbook.SheetNames[0];
    console.log('📋 Reading sheet:', sheetName);
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error('❌ Sheet not found:', sheetName);
      return;
    }
    
    console.log('🔄 Converting to JSON...');
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log('✅ Converted to JSON');
    console.log('📊 Row count:', data.length);
    
    if (data.length > 0) {
      console.log('📄 First row:', JSON.stringify(data[0], null, 2));
      
      // Test the mapping function
      console.log('🗺️ Testing row mapping...');
      const firstRow = data[0];
      const memberId = firstRow['Member ID'] || firstRow['MemberID'] || firstRow['memberId'] || firstRow['member_id'];
      const sabbathDate = firstRow['Sabbath Date'] || firstRow['Date'] || firstRow['sabbathDate'] || firstRow['sabbath_date'];
      const status = firstRow['Status'] || firstRow['status'];
      const notes = firstRow['Notes'] || firstRow['notes'] || '';
      
      console.log('Mapped values:');
      console.log('  Member ID:', memberId);
      console.log('  Sabbath Date:', sabbathDate);
      console.log('  Status:', status);
      console.log('  Notes:', notes);
      
      if (!memberId || !sabbathDate || !status) {
        console.log('⚠️ Missing required fields in first row');
      } else {
        console.log('✅ First row has all required fields');
      }
    }
    
    console.log('🎉 Excel import debugging completed successfully');
    
  } catch (error) {
    console.error('❌ Error during Excel import:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugExcelImport();