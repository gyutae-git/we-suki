const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const csvPath = 'C:\\Users\\rlarb\\OneDrive\\Documents\\카카오톡 받은 파일\\db1_cocktails_master.csv';
const targetPath = path.join(__dirname, 'server', 'data.json');

// Build a map of cocktail name -> recipe from CSV
const recipeMap = {};

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
    const name = nameKey ? row[nameKey].trim() : '';
    if (!name) return;

    recipeMap[name] = {
      glass: row['glass_raw'] || '',
      garnish: row['garnish_raw'] || '',
      method: row['method_raw'] || '',
      method_category: row['method_category'] || '',
      ingredients_raw: row['ingredients_raw'] || '',
      ingredients_ml: row['ingredients_ml'] || '',
    };
  })
  .on('end', () => {
    console.log(`Loaded ${Object.keys(recipeMap).length} recipes from CSV.`);

    const existingFile = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '{"submissions": [], "cocktails": []}';
    let data;
    try {
      data = JSON.parse(existingFile);
    } catch {
      data = { submissions: [], cocktails: [] };
    }

    // Merge recipe into each cocktail
    let matched = 0;
    data.cocktails = (data.cocktails || []).map(c => {
      const recipe = recipeMap[c.name];
      if (recipe) {
        matched++;
        // Parse ingredients_ml JSON (it can be tricky)
        let ingredients = [];
        try {
          ingredients = JSON.parse(recipe.ingredients_ml);
        } catch {
          ingredients = [];
        }
        return {
          ...c,
          recipe: {
            glass: recipe.glass,
            garnish: recipe.garnish,
            method: recipe.method,
            method_category: recipe.method_category,
            ingredients,
          }
        };
      }
      return c;
    });

    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
    console.log(`Merged recipe data into ${matched} / ${data.cocktails.length} cocktails.`);
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });
