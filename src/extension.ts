// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MessageOutlineProvider } from './messageOutline';
import { ReportOutlineProvider } from './reportOutline';
import { StructureOutlineProvider } from './structureOutline';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "vgl-language"}, 
            new ReportOutlineProvider())
    );

	context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "sm-structure"}, 
            new StructureOutlineProvider())
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "sm-messages"},
            new MessageOutlineProvider()
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
