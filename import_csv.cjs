const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const csvPath = 'C:\\Users\\rlarb\\OneDrive\\Documents\\카카오톡 받은 파일\\db1_cocktails_master.csv';
const targetPath = path.join(__dirname, 'server', 'data.json');

const cocktails = [];
let id = 1;

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    // Check keys to handle BOM characters like '\ufeffname'
    const nameKey = Object.keys(row).find(k => k.includes('name'));
    const photoKey = Object.keys(row).find(k => k.includes('image_url'));

    const name = nameKey ? row[nameKey] : '';
    const photo = photoKey ? row[photoKey] : '';

    if (name && photo) {
      cocktails.push({
        id: id++,
        name: name.trim(),
        photo: photo.trim()
      });
    }
  })
  .on('end', () => {
    const existingFile = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '{"submissions": []}';
    let data;
    try {
      data = JSON.parse(existingFile);
    } catch {
      data = { submissions: [] };
    }
    
    data.cocktails = cocktails;
    
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
    console.log('Successfully re-imported ' + cocktails.length + ' cocktails without syntax breakage using true CSV parsing!');
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });
