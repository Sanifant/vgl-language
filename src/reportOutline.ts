import * as vscode from 'vscode';

export class ReportOutlineProvider implements vscode.DocumentSymbolProvider {
    
    private routinePattern: RegExp;
    private symbols: vscode.DocumentSymbol[];

    constructor() {
        console.time("executionTime"); 
        this.routinePattern = /(?<!END)((?<global>global|GLOBAL)\s+)?(routine|ROUTINE)\s+(?<routineName>[a-z_]*)(\s*\((\s*(VALUE)?\s*[a-z_]+\s*,?)*\))?/g;
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
        console.timeLog("executionTime", "\tparsing document");
        const regex = new RegExp(this.routinePattern);
        let matches: RegExpExecArray;
        while ((matches = regex.exec(document.getText())) !== null) {
            let selectionStart = matches.index;
            let global = matches.groups.global;
            let selectionEnd = regex.lastIndex;
            let routineName = matches.groups.routineName;
            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

            console.timeLog("executionTime", `\tFound Routine ${routineName}`);

            let symbol = new vscode.DocumentSymbol(
                routineName, 
                'Component',
                vscode.SymbolKind.Function,
                range,
                range
                );            
            
            this.symbols.push(symbol);
        }

    }
}