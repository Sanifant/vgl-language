import * as vscode from 'vscode';

export class StructureOutlineProvider implements vscode.DocumentSymbolProvider {
    
    private text: string;
	private editor: vscode.TextEditor;
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

            //this.text = document.getText();

            //this.parseDocument();

            let selectionStart = 1;
            let selectionEnd = 2;

            for (const value in vscode.SymbolKind) {
                console.timeLog("structure", `\tValue: ${value}`);
                this.symbols.push(
                    new vscode.DocumentSymbol(`Value: ${value}`,
                        "Component",
                        vscode.SymbolKind.Array,
                        new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd)), 
                        new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd))
                        )
                );
            }

            resolve(this.symbols);
        });
    }

    private parseDocument(): void {
        console.timeLog("structure", "\tparsing document");
        const regex = new RegExp(this.routinePattern);
        let matches: RegExpExecArray;
        while ((matches = regex.exec(this.text)) !== null) {
            let selectionStart = matches.index;
            let global = matches.groups.global;
            let selectionEnd = regex.lastIndex;
            let routineName = matches.groups.tableName;

            console.timeLog("structure", `\tFound Routine ${routineName}`);

            let symbol = new vscode.DocumentSymbol(
                    routineName, 
                    'Component',
                    vscode.SymbolKind.Key,
                    new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd)), 
                    new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd))
                );            
            
            this.symbols.push(symbol);
        }

    }
}