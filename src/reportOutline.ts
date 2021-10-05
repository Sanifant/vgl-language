import * as vscode from 'vscode';

export class ReportOutlineProvider implements vscode.DocumentSymbolProvider {
    
    private routinePattern: RegExp;
    private classPattern: RegExp;
    private symbols: vscode.DocumentSymbol[];

    constructor() {
        this.routinePattern = /(?<!.)((?<global>global)\s+)?(routine)\s+(?<routineName>[a-z_]*)(?<parameters>\s*\((\s*(value)?\s*[a-z_0-9]+\s*,?)*\))?/gi;
        this.classPattern = /(define class)\s+(?<className>"?[a-z_]*"?)/gi;
        
        console.time("reportParsing");
	}

    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, reject) => 
        {
            this.symbols = [];

            this.parseDocument(document);

            resolve(this.symbols);
        });
    }

    private parseDocument(document: vscode.TextDocument): void {
        console.timeLog("reportParsing", "Parsing document");
        let regex = new RegExp(this.classPattern);
        let matches: RegExpExecArray;
        let classes: vscode.DocumentSymbol[] = [];
        try {
            while ((matches = regex.exec(document.getText())) !== null) {
                let selectionStart = matches.index;
                let selectionEnd = regex.lastIndex;
                let className = matches.groups.className.toLocaleLowerCase();
                let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                if(className.endsWith("_class"))
                {
                    className = className.substr(0, className.length - 6);
                }

                if(className)
                {
                    console.timeLog("reportParsing", `\tFound Class ${className} in line ${document.positionAt(selectionStart).line}`);

                    let symbol = new vscode.DocumentSymbol(
                        className, 
                        "",
                        vscode.SymbolKind.Class,
                        range,
                        range
                        );

                    classes.push(symbol);
                }
            }
                
        } catch (error) {
            console.timeLog("reportParsing", `***\tERROR ${error}`);
        }
        
        regex = new RegExp(this.routinePattern);
        try {
            while ((matches = regex.exec(document.getText())) !== null) {
                let selectionStart = matches.index;
                let global = matches.groups.global;
                let selectionEnd = regex.lastIndex;
                let routineName = matches.groups.routineName.toLocaleLowerCase();
                let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));
                let routineIcon = vscode.SymbolKind.Function;

                if(routineName)
                {
                    let classToAdd:vscode.DocumentSymbol;
                    for(var i = 0;i<classes.length;i++) { 
                        let tempClass = classes[i];
                        if(routineName.startsWith(tempClass.name))
                        {
                            classToAdd = tempClass;
                            routineName = routineName.substring(tempClass.name.length + 1);
                        }
                     }
                    console.timeLog("reportParsing", `\tFound Routine ${routineName} in line ${document.positionAt(selectionStart).line}`);
                    
                    if(routineName.startsWith("action_"))
                    {
                        if(routineName.startsWith("action_class_"))
                        {
                            routineName = routineName.substring(13);
                        } else {
                            routineName = routineName.substring(7);
                        }
                    }
                    if(routineName.startsWith("class_initialisation"))
                    {
                        routineName = classToAdd.name;
                        routineIcon = vscode.SymbolKind.Constructor;
                        global = "Constructor";
                    }

                    let symbol = new vscode.DocumentSymbol(
                        routineName, 
                        global,
                        routineIcon,
                        range,
                        range
                        );
                        
                    let paramString = matches.groups.parameters;
                    
                    if(paramString)
                    {
                        let variables = paramString.replace("(", "").replace(")", "").replace(/value/gi, "").split(",");

                        while(variables.length > 0)
                        {
                            let variable = variables.pop().trim();
                            console.log(`\tFound Parameter ${variable}`);

                            let parameter = new vscode.DocumentSymbol(
                                variable.toLocaleLowerCase(), 
                                "",
                                vscode.SymbolKind.Key,
                                range,
                                range
                                );

                            symbol.children.push(parameter);
                        }
                    }

                    if(classToAdd)
                    {
                        classToAdd.children.push(symbol);
                    } else {                                           
                        this.symbols.push(symbol);
                    }
                }
            }
                
        } catch (error) {

            console.timeLog("reportParsing", `***\tERROR ${error}`);

        } finally {

            console.timeEnd("reportParsing");

        }

        classes.forEach(c => {
            this.symbols.push(c);
        });
    }
}