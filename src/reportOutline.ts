import * as vscode from 'vscode';

export class ReportOutlineProvider implements vscode.DocumentSymbolProvider {
    
    private routinePattern: RegExp;
    private symbols: vscode.DocumentSymbol[];

    constructor() {
        this.routinePattern = /(?<!.)((?<global>global)\s+)?(routine)\s+(?<routineName>[a-z_]*)(?<parameters>\s*\((\s*(value)?\s*[a-z_]+\s*,?)*\))?/gi;
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
        console.time("reportParsing");
        console.timeLog("reportParsing", "Parsing document");
        const regex = new RegExp(this.routinePattern);
        let matches: RegExpExecArray;
        try {
            while ((matches = regex.exec(document.getText())) !== null) {
                let selectionStart = matches.index;
                let global = matches.groups.global;
                let selectionEnd = regex.lastIndex;
                let routineName = matches.groups.routineName;
                let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                if(routineName)
                {
                    console.timeLog("reportParsing", `\tFound Routine ${routineName} in line ${document.positionAt(selectionStart).line}`);

                    let symbol = new vscode.DocumentSymbol(
                        routineName, 
                        global,
                        vscode.SymbolKind.Function,
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
                                variable, 
                                'Component',
                                vscode.SymbolKind.Key,
                                range,
                                range
                                );

                            symbol.children.push(parameter);
                        }
                    }

                    this.symbols.push(symbol);
                }
            }
                
        } catch (error) {

            console.timeLog("reportParsing", `***\tERROR ${error}`);

        } finally {

            console.timeEnd("reportParsing");

        }
    }
}