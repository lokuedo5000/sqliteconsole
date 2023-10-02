
class CustomConsole {
  constructor() {
    this.editors = {};
  }

  async _ajax(url, method, data) {
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
  _search(array, obj, value) {
    const resultados = array.filter((elemento) => {
      return elemento[obj] === value;
    });
    return resultados;
  }
  init(config) {
    const { textareaElementId, customMode, customKeyMap, customLanguage, theme = "default", autofocus = false } = config;

    const editor = CodeMirror.fromTextArea(document.getElementById(textareaElementId), {
      mode: customMode || "text/plain",
      lineNumbers: true,
      theme: theme,
      extraKeys: {
        // Tab: (editor) => this.handleTabKey(editor, customKeyMap),
        ...customKeyMap
      },
      hintOptions: {
        completeSingle: false
      },
      viewportMargin: Infinity,
      autofocus: autofocus,
    });

    // Almacena el editor en el objeto this.editors
    this.editors[textareaElementId] = editor;

    // Manejar redimensionamiento de ventana
    window.addEventListener("resize", () => {
      editor.setSize("100%", "100%");
      editor.refresh();
    });

    CodeMirror.registerHelper("hint", customLanguage, (editor, options) => {
      const cur = editor.getCursor();
      const token = editor.getTokenAt(cur);
      const currentWord = token.string;

      // Implementa la lógica de sugerencias para el modo personalizado o específico del lenguaje aquí
      // ...

      // Ejemplo de sugerencia básica (personalízala según tus necesidades):
      const suggestions = ["suggestion1", "suggestion2", "suggestion3"];

      return {
        list: suggestions,
        from: CodeMirror.Pos(cur.line, token.start),
        to: CodeMirror.Pos(cur.line, token.end)
      };
    });
  }


  handleTabKeySqlite(editor) {
    const cur = editor.getCursor();
    const token = editor.getTokenAt(cur);
    const currentWord = token.string;

    const customSamples = {
      "selectAll": "SELECT * FROM table_name;",
      "selectColumns": "SELECT column1, column2 FROM table_name;",
      "insertData": "INSERT INTO table_name (column1, column2)\nVALUES (value1, value2);",
      "update": "UPDATE table_name SET column1 = new_value WHERE condition;",
      "delete": "DELETE FROM table_name WHERE condition;",
      "createTable": "CREATE TABLE IF NOT EXISTS name_table (\n  id INTEGER PRIMARY KEY,\n  column1 TEXT,\n  column2 INTEGER,\n  column3 BLOB\n);",
      "alterTable": "ALTER TABLE table_name ADD COLUMN new_column datatype;",
      "renameTable": "ALTER TABLE table_name RENAME TO new_name;",
      "dropTable": "DROP TABLE IF EXISTS table_name;",
      "customInsert": "INSERT INTO table_name (column1, column2, column3)\nVALUES ('value', 'value', 'value');",
      "customSelect": "SELECT custom_column FROM custom_table WHERE custom_condition;",
      "selectColumn2": "SELECT column1, column2 FROM table_name WHERE condition1;",
      "getAllNamesTable": "SELECT name FROM sqlite_master WHERE type='table';",
      "columns": "SELECT name FROM pragma_table_info('name_table')"
    };

    // Agrega alias para las nuevas muestras SQL
    const alias = {
      "tb": "createTable",
      "new": "createTable",
      "all": "selectAll",
      "selectall": "selectAll",
      "deletetable": "dropTable",
      "drop": "dropTable",
      "insert": "insertData",
      "select": "customSelect",
      "select2": "selectColumn2",
      "newinsert": "customInsert",
      "alter": "alterTable",
      "rename": "renameTable",
      "allnames": "getAllNamesTable",
      "allcolumns": "columns",
      "column": "columns",
    };

    let sampleQuery = false;
    if (alias[currentWord]) {
      sampleQuery = customSamples[alias[currentWord]];
    } else {
      sampleQuery = customSamples[currentWord];
    }

    if (sampleQuery) {
      editor.replaceRange(sampleQuery, CodeMirror.Pos(cur.line, 0), cur);
    } else {
      editor.execCommand("indentMore");
    }
  }

  showAllSuggestions(editor) {
    const customKeywords = ["keyword1", "keyword2", "keyword3"];
    const additionalSuggestions = ["suggestion1", "suggestion2", "suggestion3"];

    const allSuggestions = [...customKeywords, ...additionalSuggestions];

    editor.showHint({ list: allSuggestions });
  }

  setLine(lineNumber, id, textToInsert, clearLines = false) {
    const editor = this.editors[id];

    if (clearLines) {
      const linesToKeep = editor.getRange({ line: 0, ch: 0 }, { line: lineNumber - 1, ch: 0 });
      editor.setValue(linesToKeep);
      return;
    }

    editor.replaceRange("", { line: lineNumber - 1, ch: 0 }, { line: lineNumber, ch: 0 });

    const totalLines = editor.lineCount();
    if (lineNumber > totalLines) {
      for (let i = totalLines; i < lineNumber; i++) {
        editor.replaceRange("\n", { line: i, ch: 0 });
      }
    }
    editor.replaceRange(textToInsert, { line: lineNumber - 1, ch: 0 });
  }

  veryJson(datos) {
    try {

      const jsonstringify = JSON.stringify(datos, null, 2);
      const jsonparse = JSON.parse(jsonstringify);

      if (typeof jsonparse === 'object') {
        return jsonstringify;
      }

    } catch (error) {
      datos = datos;
    }

    // Si no es JSON válido o hubo un error, devuelve la cadena original
    return datos;
  }

  sql(contenedor = false) {
    this.init({
      textareaElementId: "sql-editor",
      customMode: "text/x-sql",
      autofocus: true,
      theme: "duotone-dark",
      customKeyMap: {
        Tab: () => this.handleTabKeySqlite(this.editors["sql-editor"]),
      },
      customLanguage: "sql",
    });

    const editor = this.editors["sql-editor"];


  }

  json() {
    this.init({
      textareaElementId: "json-editor",
      customMode: "application/json",
      theme: "material-ocean",
      customKeyMap: {
        "Ctrl-Enter": () => console.log("Ctrl-Enter pressed in JSON editor"),
      },
      customLanguage: "json",
    });



    // Configurar el enfoque solo para el editor SQL
    const editor = this.editors["json-editor"];
    editor.setOption("readOnly", true);

    if (memory.all.list.length > 0) {
      let get = this._search(memory.all.list, "id", memory.all.active);
      if (get.length > 0) {
        this.setLine(1, "json-editor", "");
        this.setLine(2, "json-editor", "");
        this.setLine(4, "json-editor", "");
        this.setLine(1, "json-editor", get[0].file);
        this.setLine(2, "json-editor", "connected: " + kit.dirname(get[0].file));

        this.setLine(4, "json-editor", "CREATE TABLE IF NOT EXISTS name_table (\n  id INTEGER PRIMARY KEY,\n  column1 TEXT,\n  column2 INTEGER,\n  column3 BLOB\n);");
      }
    }

    // editor.setOption("readOnly", true);
    //     var readOnlyLines = [0,1,2,3];
    //     sqlEditor.on('beforeChange',function(cm,change) {
    //     if ( ~readOnlyLines.indexOf(change.from.line) ) {
    //         change.cancel();
    //     }
    // });
  }

  text() {
    this.init({
      textareaElementId: "text-editor",
      customMode: "text/plain",
      theme: "material-ocean",
      customKeyMap: {
        "Ctrl-Enter": () => console.log("Ctrl-Enter pressed in JSON editor"),
      },
      customLanguage: "text",
    });



    // Configurar el enfoque solo para el editor SQL
    const editor = this.editors["text-editor"];
    editor.setOption("readOnly", true);

    if (memory.all.list.length > 0) {
      let get = this._search(memory.all.list, "id", memory.all.active);
      if (get.length > 0) {
        this.setLine(1, "text-editor", "");
        this.setLine(2, "text-editor", "");
        this.setLine(1, "text-editor", get[0].file);
        this.setLine(2, "text-editor", "connected: " + kit.dirname(get[0].file));

        // this.setLine(4, "text-editor", "CREATE TABLE IF NOT EXISTS name_table (\n  id INTEGER PRIMARY KEY,\n  column1 TEXT,\n  column2 INTEGER,\n  column3 BLOB\n);");
      }
    }

    // editor.setOption("readOnly", true);
    //     var readOnlyLines = [0,1,2,3];
    //     sqlEditor.on('beforeChange',function(cm,change) {
    //     if ( ~readOnlyLines.indexOf(change.from.line) ) {
    //         change.cancel();
    //     }
    // });
  }

  javaScript() {
    this.init({
      textareaElementId: "javascript-editor",
      customMode: "text/javascript",
      customKeyMap: {
        "Ctrl-Enter": () => console.log("Ctrl-Enter pressed in JavaScript editor"),
      },
      customLanguage: "javascript",
    });
  }

  getValue(textareaElementId) {
    const editor = this.editors[textareaElementId];
    return editor.getValue();
  }

  setValue(textareaElementId, value) {
    const editor = this.editors[textareaElementId];
    editor.setValue(value);
  }

  async sendCode(textareaElementId) {
    const editor = this.editors[textareaElementId];
    const textEditor = editor.getValue();

    if (textEditor.trim() == "clear") {
      let get = this._search(memory.all.list, "id", memory.all.active);
      if (get.length > 0) {
        this.setValue("sql-editor", "");
        this.setValue("text-editor", "")
        this.setLine(1, "text-editor", get[0].file);
        this.setLine(2, "text-editor", "connected: " + kit.dirname(get[0].file));
      }
      return;
    }
    const send = await this._ajax("/run-db", "POST", { codigo: textEditor, id: memory.all.active });
    return send.result;
  }
}
