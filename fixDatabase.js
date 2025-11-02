// fixDatabase.js
const Database = require('better-sqlite3');
const fs = require('fs');

const INPUT_FILE = 'gmp.db'; // Your current file with raw content
const OUTPUT_FILE = 'gmp_fixed.db'; // Name for the new, valid database

async function fixDatabase() {
  try {
    console.log(`Reading raw content from ${INPUT_FILE} as a buffer...`);
    const buffer = fs.readFileSync(INPUT_FILE);

    console.log('Opening raw content as temporary in-memory database...');
    const tempDb = new Database(':memory:');

    // Deserialize the raw buffer into the in-memory database
    // This is the correct way to load the internal SQLite format
    tempDb.deserialize(buffer);
    console.log('Successfully loaded raw content into temporary database.');

    console.log(`Creating new database file and copying data: ${OUTPUT_FILE}`);
    // Perform the backup from the in-memory database to the new file
    const backup = tempDb.backup(OUTPUT_FILE);
    backup.step(-1); // Execute the entire backup
    backup.close(); // Close the backup process
    console.log('Backup completed successfully!');

    // Close the temporary database
    tempDb.close();

    console.log('Verification: Attempting to read tables from new database...');
    const verifyDb = new Database(OUTPUT_FILE);
    // Use a parameterized query or a string without conflicting quotes
    const tables = verifyDb.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
    console.log('Tables found in new database:', tables.map(t => t.name));
    verifyDb.close();

    console.log(`Process completed. Your new database is ${OUTPUT_FILE}.`);
    console.log(`Remember to update your .env file to: DATABASE_PATH=${OUTPUT_FILE}`);

  } catch (error) {
    console.error('An error occurred during the database fix process:', error.message);
    console.error('Stack:', error.stack);

    // Ensure tempDb is closed even if an error occurs
    if (typeof tempDb !== 'undefined' && tempDb && tempDb.open) {
      tempDb.close();
    }
  }
}

fixDatabase();