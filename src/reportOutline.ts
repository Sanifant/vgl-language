import * as vscode from 'vscode';

export class ReportOutlineProvider implements vscode.DocumentSymbolProvider {
    readonly onDidChangeTreeData?: vscode.Event<any> | undefined;
    
    private text: string;
	private editor: vscode.TextEditor;
    private routinePattern: RegExp;
    private nodes: Routine[];
    private symbols: vscode.DocumentSymbol[];

    constructor() {
        console.time("executionTime"); 
        this.routinePattern = /(?<!END)((?<global>global|GLOBAL)\s+)?(routine|ROUTINE)\s+(?<routineName>[a-z_]*)(\s*\((\s*(VALUE)?\s*[a-z_]+\s*,?)*\))?/g;
	}

    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, reject) => 
        {
            this.symbols = [];

            this.text = document.getText();

            this.parseDocument();

            resolve(this.symbols);
        });
    }

    private parseDocument(): void {
        this.editor = vscode.window.activeTextEditor;
		if (this.editor && this.editor.document) {
			const regex = new RegExp(this.routinePattern);
            let matches;
            while ((matches = regex.exec(this.text)) !== null) {
                let selectionStart = matches.index;
                let global = matches.groups.global;
                let selectionEnd = regex.lastIndex;

                let symbol = new vscode.DocumentSymbol(
                    matches.groups.routineName, 
                    'Component',
                    vscode.SymbolKind.Function,
                    new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd)), 
                    new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd)));
                
                
            this.symbols.push(symbol);
            }
		}

    }
}

export class Routine extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isPrivate: boolean,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `Routine declaration for ${this.label}`;
		this.description = `Routine declaration for ${this.label}`;

        if(isPrivate)
        {
            this.iconPath = new vscode.ThemeIcon("mirror-private");
        }
        else{
            this.iconPath = new vscode.ThemeIcon("octoface");
        }
	}
}