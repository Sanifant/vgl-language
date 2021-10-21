// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MessageOutlineProvider } from './messageOutline';
import { ReportOutlineProvider } from './reportOutline';
import { StructureOutlineProvider } from './structure/structureOutline';
import * as data from './structure/structure';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let myStatusBarItem: vscode.StatusBarItem;
let structureParser:StructureOutlineProvider;
let x: number;
let y: number;

export function activate(context: vscode.ExtensionContext) {
    x=0;
    y=0;
    structureParser = new StructureOutlineProvider();

	context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "vgl-language"}, 
            new ReportOutlineProvider())
    );

	context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "sm-structure"}, 
            structureParser)
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "sm-messages"},
            new MessageOutlineProvider()
        )
    );

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	//myStatusBarItem.command = myCommandId;
	context.subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(eins));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(zwei));
}

function eins(e:vscode.TextEditor) : void{
    structureParser.parseDocument(e.document, e.selection);
    myStatusBarItem.text = `$(megaphone) onDidChangeActiveTextEditor ${x++}`;
    myStatusBarItem.show();
}
function zwei(e:vscode.TextEditorSelectionChangeEvent) : void{
    structureParser.parseDocument(e.textEditor.document, e.selections[0]);
    myStatusBarItem.text = `$(megaphone) onDidChangeTextEditorSelection ${y++}`;
    myStatusBarItem.show();
}

// this method is called when your extension is deactivated
export function deactivate() {}
