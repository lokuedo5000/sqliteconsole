const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class DatabaseManager {
    constructor() {
        this.active = null;
        this.list = [];
        this.databases = {};
    }

    async createDatabase(saveIn, { databaseName, ext, password = null }) {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(saveIn, `${databaseName}${ext}`);
            const nameBase64 = Buffer.from(dbPath).toString('base64');
            try {
                const db = new sqlite3.Database(dbPath);

                this.active = nameBase64;
                this.list.unshift({ file: dbPath, id: nameBase64 });
                this.databases[nameBase64] = {
                    file: dbPath,
                    db: db
                };
                resolve(this.databases[nameBase64].db);
            } catch (error) {
                reject(error)
            }
        });
    }

    openDatabase(databaseName) {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(databaseName);
            const nameBase64 = Buffer.from(databaseName).toString('base64');
            if (!this.databases[nameBase64]) {

                try {
                    const db = new sqlite3.Database(dbPath);

                    this.active = nameBase64;
                    this.list.unshift({ file: databaseName, id: nameBase64 });
                    this.databases[nameBase64] = {
                        file: databaseName,
                        db: db
                    };

                    resolve(this.databases[nameBase64].db);
                } catch (error) {
                    reject(error)
                }

            } else {
                resolve("db_exist");
            }


        });
    }

    closeDB(databaseName) {
        return new Promise((resolve, reject) => {
            const db = this.databases[databaseName];

            if (db) {
                const database = db.db;

                database.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                       
                        delete this.databases[databaseName];
    
                        const index = this.list.findIndex((item) => item.id === databaseName);
                        if (index !== -1) {
                            this.list.splice(index, 1);
    
                            if (this.list.length > 0) {
                                this.active = this.list[0].id;
                            } else {
                                this.active = null;
                                this.list = [];
                            }
                        }
    
                        resolve(true);
                    }
                });
            } else {
                reject("data_base_no_exist");
            }
        });
    }


    async executeQuery(databaseName, query) {
        return new Promise((resolve, reject) => {
            const db = this.databases[databaseName];
    
            if (db) {
                const database = db.db;
    
                // Verificar si es una consulta SELECT
                if (query.trim().toUpperCase().startsWith("SELECT")) {
                    database.all(query, [], function (err, rows) {
                        if (err) {
                            reject({ result: err.message });
                        } else {
                            // Modificar los resultados para reemplazar BLOB o buffers y acortar los valores TEXT
                            const modifiedRows = rows.map((row) => {
                                for (const key in row) {
                                    if (Buffer.isBuffer(row[key])) {
                                        row[key] = "[BLOB Data]";
                                    } else if (typeof row[key] === "string" && row[key].length > 300) {
                                        // Acortar valores TEXT si tienen más de 300 caracteres
                                        row[key] = row[key].substring(0, 300) + "..."; // Puedes ajustar el número de caracteres según tus necesidades
                                    }
                                }
                                return row;
                            });
    
                            resolve({ result: `Successful\n${JSON.stringify(modifiedRows, null, 2)}` });
                        }
                    });
                } else {
                    // No es una consulta SELECT, usar database.run
                    database.run(query, [], function (err) {
                        if (err) {
                            reject({ result: err.message });
                        } else {
                            resolve({ result: `Successful\n${query}` });
                        }
                    });
                }
            } else {
                reject(new Error(`Database '${databaseName}' not found.`));
            }
        });
    }


}

module.exports = DatabaseManager;
