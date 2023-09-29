const { app, BrowserWindow, dialog } = require('electron');

const path = require("path");
const fs = require("fs");

// Database
const Database = require("../../../container/database");
const db = new Database();

// UtilNode
const UtilNode = require("../../../data/apps/modules/utilnode");
const utilnode = new UtilNode({
    electron: { dialog, BrowserWindow },
    database: db
});

// Manager
const DatabaseManager = require("./app/module/db")
const databasemanager = new DatabaseManager();

// libraries
const lib = require("../modules/util-libraries");

const routes = [
    {
        method: 'get',
        path: '/',
        handler: (req, res) => {
            // render
            res.render(path.join(__dirname, "app", "views", "console"));
        }
    },
    {
        method: 'post',
        path: '/new-db',
        handler: async (req, res) => {
            let { databaseName, ext, password } = req.body;
            // open folder
            try {
                const folder_open = await utilnode.openFolder();
                await databasemanager.createDatabase(folder_open, { databaseName, ext, password });
                res.send({
                    active: databasemanager.active,
                    list: databasemanager.list
                });
            } catch (error) {
                res.send(false);
            }
        }
    },
    {
        method: 'post',
        path: '/open-db',
        handler: async (req, res) => {
            // open folder
            try {
                const selectedFile = await utilnode.openFile({
                    title: "Seleccionar archivo de base de datos",
                    filters: [
                        {
                            name: "Bases de datos SQLite",
                            extensions: ["db", "sqlite", "lw"]
                        }
                    ]
                });
                if (selectedFile) {
                    const db = await databasemanager.openDatabase(selectedFile);
                    if (db == "db_exist") {
                        res.send(db)
                    }else{
                        res.send({
                            active: databasemanager.active,
                            list: databasemanager.list
                        }); 
                    }
                    
                }else{
                    res.send(false);
                }
                

            } catch (error) {
                res.send(false);
            }
        }
    },
    {
        method: 'post',
        path: '/get-all-db',
        handler: async (req, res) => {
            res.json({
                active: databasemanager.active,
                list: databasemanager.list
            });
        }
    },
    {
        method: 'post',
        path: '/set-active-db',
        handler: async (req, res) => {
            databasemanager.active = req.body.active;
            res.send(databasemanager.active);
        }
    },
    {
        method: 'post',
        path: '/close-db',
        handler: async (req, res) => {
            try {
                const { id } = req.body;
                const rundb = await databasemanager.closeDB(id);
                if (rundb == "data_base_no_exist") {
                    res.json({result: "error"});
                }else{
                    res.json({
                        active: databasemanager.active,
                        list: databasemanager.list
                    });
                }
                
            } catch (error) {
                res.json({
                    active: databasemanager.active,
                    list: databasemanager.list
                });
            }
        }
    },
    {
        method: 'post',
        path: '/run-db',
        handler: async (req, res) => {
            try {
                const { codigo, id } = req.body;

                const rundb = await databasemanager.executeQuery(id, codigo);
                res.send(rundb)

            } catch (error) {
                res.send({result: "algo salio mal"})
            }
        }
    }
]

module.exports = [...routes, ...lib];