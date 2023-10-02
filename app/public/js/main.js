const sqliteConsole = new CustomConsole("sql-editor");

function _ajax(url, method, data) {
    return new Promise((resolve, reject) => {
        kit.send({
            url: url,
            method: method,
            data,
            success: (respuesta) => {
                resolve(respuesta);
            },
            error: (codigo, respuesta) => {
                reject({ codigo, respuesta });
            }
        });
    });
}

function getdbs(array) {
    kit.existsElm("#list-db", (evn) => {
        if (array.list.length > 0) {
            let dataArray = array.list;
            evn.innerHTML = "";
            for (const item of dataArray) {
                evn.innerHTML += `<label>
                                  <span class="icon-database2"></span>
                                  <div class="db-text">${kit.dirname(item.file)}</div>
                                  <input name="name_db_radio" value="${item.id}" type="radio" />
                                  <span class="radios-input"></span>
                              </label>`;
            }

            kit.qsSelector(false, `[value='${array.active}']`).checked = true;

            kit.qsSelector("all", "[type=radio]", (val) => {
                val.forEach(click => {
                    click.addEventListener("click", async (e) => {
                        const res = await _ajax("/set-active-db", "POST", { active: e.target.value });
                        if (res) {
                            memory.all.active = res;
                            // select tb
                            let get = sqliteConsole._search(memory.all.list, "id", memory.all.active);
                            if (get.length > 0) {
                                sqliteConsole.setValue("text-editor", "")
                                sqliteConsole.setLine(1, "text-editor", get[0].file);
                                sqliteConsole.setLine(2, "text-editor", "connected: " + kit.dirname(get[0].file));
                            }
                        }
                    })
                });
            });

        } else {
            evn.innerHTML = "";
            memory.all.active = null;
            memory.all.list = [];
            sqliteConsole.setValue("text-editor", "")
        }

    });



}

kit.onDOMReady(async () => {
    // all
    const get_all = await _ajax("/get-all-db", "POST", {});
    memory.all = get_all;
    // Uso de la clase SqliteConsole
    sqliteConsole.sql(".console-body");
    sqliteConsole.text();

    getdbs(memory.all);
    kit.onClick("open-db-action", async () => {
        const get_all = await _ajax("/open-db", "POST", {});
        if (get_all == "db_exist") {
            M.toast({ html: 'Esta base de datos ya está listada.' })
            return
        }
        if (get_all) {
            memory.all = get_all;
            getdbs(memory.all);
            // select tb
            let get = sqliteConsole._search(memory.all.list, "id", memory.all.active);
            if (get.length > 0) {
                sqliteConsole.setValue("text-editor", "")
                sqliteConsole.setLine(1, "text-editor", get[0].file);
                sqliteConsole.setLine(2, "text-editor", "connected: " + kit.dirname(get[0].file));
            }

            M.toast({ html: 'Conexión a la Base de Datos correctamente' })
        } else {
            M.toast({ html: 'No fue posible crear la Base de datos' })
        }
    });

    kit.onClick("create-db", async () => {
        const name_db = kit.qsSelector(false, "[name=name_db]");
        const extension_db = kit.qsSelector(false, "[name=extension_db]");

        if (name_db.value.length < 1 && !/\S/.test(name_db.value) && extension_db.value.length < 1 && !/\S/.test(extension_db.value)) {
            return;
        }

        let info_db = {
            databaseName: name_db.value,
            ext: extension_db.value,
        }
        const send_info = await _ajax("/new-db", "POST", info_db);
        if (send_info) {
            memory.all = send_info;
            getdbs(memory.all);

            // select tb
            let get = sqliteConsole._search(memory.all.list, "id", memory.all.active);
            if (get.length > 0) {
                sqliteConsole.setValue("text-editor", "")
                sqliteConsole.setLine(1, "text-editor", get[0].file);
                sqliteConsole.setLine(2, "text-editor", "connected: " + kit.dirname(get[0].file));
            }

            kit.modal('materialize', "#newdb", "close");
            M.toast({ html: 'Base de datos creada con éxito' })
        } else {
            M.toast({ html: 'No fue posible crear la Base de datos' })
        }

    });


    kit.onClick("run-code", async () => {
        const editor = sqliteConsole.editors["sql-editor"];
        const textEditor = editor.getValue();
        if (textEditor.trim() == "clear") {
            await sqliteConsole.sendCode("sql-editor");
            return;
        }
        if (memory.all.active) {
            const res = await sqliteConsole.sendCode("sql-editor");
            sqliteConsole.setLine(3, "text-editor", null, true);
            sqliteConsole.setLine(4, "text-editor", res);
            sqliteConsole.setValue("sql-editor", "");
        } else {
            M.toast({ html: 'Primero seleccione una base de datos' })
        }

    })

    kit.onClick("open-console", async () => {
        kit.qsSelector(false, ".console-result", (e) => {
            e.classList.toggle("open-console-up");
        });
        kit.qsSelector(false, "body", (e) => {
            e.classList.toggle("open-console-up-body");
        });
    })

    kit.onClick("close-db", async () => {
        if (memory.all.active) {
            const isclose = await _ajax("/close-db", "POST", { id: memory.all.active });
            if (isclose.result == "error") {
                M.toast({ html: 'No fue posible cerrar la conexion' })
            } else {
                memory.all = isclose;
                getdbs(memory.all);
                M.toast({ html: 'Base de datos eliminada' })
                // select tb
                let get = sqliteConsole._search(memory.all.list, "id", memory.all.active);
                if (get.length > 0) {
                    sqliteConsole.setValue("text-editor", "")
                    sqliteConsole.setLine(1, "text-editor", get[0].file);
                    sqliteConsole.setLine(2, "text-editor", "connected: " + kit.dirname(get[0].file));
                }
            }
        } else {
            M.toast({ html: 'Primero seleccione una base de datos' })
        }


    })

})