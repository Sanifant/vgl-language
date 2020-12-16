import * as vscode from 'vscode';

export class ReportOutlineProvider implements vscode.TreeDataProvider<Routine> {
    readonly onDidChangeTreeData?: vscode.Event<any> | undefined;
    
	private tree: any = null;
	private text: string;
	private editor: vscode.TextEditor;
	private autoRefresh = true;
    private routinePattern: RegExp;
    private nodes: Routine[];

    constructor(private context: vscode.ExtensionContext) {
        vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
        console.time("executionTime"); 
        this.nodes = new Array();
        this.routinePattern = /(?<!END)(routine|ROUTINE)\s+(?<routineName>[a-z_]*)\s\((\s*(VALUE)?\s*[a-z_]+\s*,?)*\)/g;
        //this.parseDocument();
        this.onActiveEditorChanged();
	}
    
    getTreeItem(element: Routine): vscode.TreeItem {
        console.timeLog("executionTime", "calling getTreeItem");
        return element;
    }

    getChildren(element?: Routine): Routine[] {
        console.timeLog("executionTime", "calling getChildren");
        return this.nodes;
    }

    select(range: vscode.Range) {
        this.editor.revealRange(range);
		this.editor.selection = new vscode.Selection(range.start, range.end);
	}

	private onActiveEditorChanged(): void {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				const enabled = vscode.window.activeTextEditor.document.languageId === 'vgl-report';
				vscode.commands.executeCommand('setContext', 'reportOutlineEnabled', enabled);
				if (enabled) {
					this.parseDocument();
				}
			}
		} else {
			vscode.commands.executeCommand('setContext', 'reportOutlineEnabled', false);
		}
	}

    private parseDocument(): void {
        this.text = '';
        this.tree = null;
        this.editor = vscode.window.activeTextEditor;
		if (this.editor && this.editor.document) {
			this.text = this.editor.document.getText();
			const regex = new RegExp(this.routinePattern);
            const text = this.editor.document.getText();
            let matches;
            while ((matches = regex.exec(text)) !== null) {
                let selectionStart = matches.index;
                let selectionEnd = matches.index + matches[0].length;
                var treeNode = new Routine(
                    matches.groups.routineName,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'extension.openReportSelection',
                        title: '',
                        arguments: [new vscode.Range(this.editor.document.positionAt(selectionStart), this.editor.document.positionAt(selectionEnd))]
                    }
                );
                
                let arraySize = this.nodes.push(treeNode);
                console.timeLog("executionTime", "Array of Routines: " + arraySize) ;
            }
		}

    }
}

export class Routine extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `Routine declaration for ${this.label}`;
		this.description = `Routine declaration for ${this.label}`;

        console.timeLog("executionTime", `Created new Routinedefinition for ${this.label}`) ;
	}
}