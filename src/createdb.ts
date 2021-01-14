import * as sqlite3 from 'sqlite3';
const fs = require('fs');
let spawn = require("child_process").spawn;
let child = spawn("sqlite3", ["sql/data.db"]);

// Create the required tables
fs.createReadStream("./sql/init.sql").pipe(child.stdin);


