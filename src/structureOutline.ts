import * as vscode from 'vscode';

export class StructureOutlineProvider implements vscode.DocumentSymbolProvider {
    
    private tablePattern: RegExp;
    private viewPattern: RegExp;
    private symbols: vscode.DocumentSymbol[];

    constructor() {
        console.time("structure"); 
        this.tablePattern = /(?<![a-z_])table\s+(?<tableName>[a-zA-Z_]+)\s*[a-zA-Z_\s\']*;/gi;
        this.viewPattern = /(?<![a-z_])view\s+(?<viewName>[a-zA-Z_]+)\s*[a-zA-Z_\s\',]*;/gi;
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
        let regex = new RegExp(this.tablePattern);
        let matches: RegExpExecArray;
        while ((matches = regex.exec(document.getText())) !== null) {
            let selectionStart = matches.index;
            let selectionEnd = regex.lastIndex;
            let tableName = matches.groups.tableName.toLocaleLowerCase();
            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

            console.timeLog("structure", `\tFound Table ${tableName}`);

            let symbol = new vscode.DocumentSymbol(
                tableName, 
                    'Table',
                    vscode.SymbolKind.Key,
                    range,
                    range
                );            
            
            this.symbols.push(symbol);
        }
        regex = new RegExp(this.viewPattern);
        while ((matches = regex.exec(document.getText())) !== null) {
            let selectionStart = matches.index;
            let selectionEnd = regex.lastIndex;
            let viewName = matches.groups.viewName.toLocaleLowerCase();
            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

            console.timeLog("structure", `\tFound view ${viewName}`);

            let symbol = new vscode.DocumentSymbol(
                viewName, 
                    'View',
                    vscode.SymbolKind.Key,
                    range,
                    range
                );            
            
            this.symbols.push(symbol);
        }

    }
}