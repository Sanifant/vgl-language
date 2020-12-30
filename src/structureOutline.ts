import * as vscode from 'vscode';

export class StructureOutlineProvider implements vscode.DocumentSymbolProvider {
    
    private routinePattern: RegExp;
    private symbols: vscode.DocumentSymbol[];

    constructor() {
        console.time("structure"); 
        this.routinePattern = /(table|TABLE)\s+(?<tableName>[a-zA-Z_]+)\s*[a-zA-Z_\s\']*;/g;
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
        console.timeLog("structure", "\tparsing document");
        const regex = new RegExp(this.routinePattern);
        let matches: RegExpExecArray;
        while ((matches = regex.exec(document.getText())) !== null) {
            let selectionStart = matches.index;
            let selectionEnd = regex.lastIndex;
            let routineName = matches.groups.tableName;
            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

            console.timeLog("structure", `\tFound Routine ${routineName}`);

            let symbol = new vscode.DocumentSymbol(
                    routineName, 
                    'Component',
                    vscode.SymbolKind.Key,
                    range,
                    range
                );            
            
            this.symbols.push(symbol);
        }

    }
}