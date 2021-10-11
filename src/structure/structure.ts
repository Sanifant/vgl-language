import * as vscode from 'vscode';

export class Structure{
    dataItems: DataStoreUnit[];
}

export class DataStoreUnit extends vscode.DocumentSymbol {
    name: string;
    fields: Field[];
    symbol: vscode.SymbolKind;

    constructor(name: string, group: string, symbol:vscode.SymbolKind, range: vscode.Range, selectionRange: vscode.Range){
        super(name, group, symbol, range, selectionRange)
        this.symbol = symbol;
    }
}

export class Table extends DataStoreUnit {
    constructor(name: string, group: string, range: vscode.Range, selectionRange: vscode.Range){
        super(name, group, vscode.SymbolKind.Key, range, selectionRange);
    }
}

export class View extends DataStoreUnit {
    constructor(name: string, group: string, range: vscode.Range, selectionRange: vscode.Range){
        super(name, group, vscode.SymbolKind.Key, range, selectionRange);
    }
}

export class Field extends vscode.DocumentSymbol {
    name: string;
    dataType: string;
    
    constructor(name: string, group: string, range: vscode.Range, selectionRange: vscode.Range){
        super(name, group, vscode.SymbolKind.Key, range, selectionRange);
    }
}

