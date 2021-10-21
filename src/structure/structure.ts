import { timeStamp } from 'console';
import { maxHeaderSize } from 'http';
import * as vscode from 'vscode';

export class Structure{

    dataItems: DataStoreUnit[];
    hash: number;

    /**
     *
     */
    constructor() {
        this.dataItems = [];        
        this.hash = 0;
    }

    addDataItem(item: DataStoreUnit){

        let replaced = false;

        for(var index in this.dataItems)
        {
            if(this.dataItems[index].name === item.name){
                this.dataItems[index] = item;
                replaced = true;
            }
        }

        if(replaced !== true)
        {
            this.dataItems.push(item);
        }
    }
}

export abstract class DataStoreUnit extends vscode.DocumentSymbol {
    name: string;
    fields: Field[];
    symbol: vscode.SymbolKind;

    constructor(name: string, group: string, symbol:vscode.SymbolKind, range: vscode.Range, selectionRange: vscode.Range){
        super(name, group, symbol, range, selectionRange);
        this.symbol = symbol;
        this.fields = [];
    }

    addField(field: Field){
        this.fields.push(field);
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

