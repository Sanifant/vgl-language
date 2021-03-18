import * as vscode from 'vscode';

export class MessageOutlineProvider implements vscode.DocumentSymbolProvider {

    //(message group)\s+=\s"(?<group>[a-z_]*)"
    //(message)\s+=\s"(?<message>[a-z_]*)"
    //(Text)\s+=\s"(?<message>[a-z_ 0-9]*)"
    
    private symbols: vscode.DocumentSymbol[];
    private globalPattern: RegExp;

    constructor(){
        console.time("message");
        this.globalPattern = /(?<type>(message group|message|text))\s+=\s+"(?<payload>[a-z0-9-_ ]*)"/gi;
    }
    
    
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, reject) => 
        {
            this.symbols = [];

            this.parseDocument(document);
            
            resolve(this.symbols);
        });
    }
    parseDocument(document: vscode.TextDocument) {
        let regex = new RegExp(this.globalPattern);
        let matches:RegExpExecArray;
        let symbol: vscode.DocumentSymbol;
        let child: vscode.DocumentSymbol;

        while ((matches = regex.exec(document.getText())) !== null) {
            let selectionStart = matches.index;
            let selectionEnd = regex.lastIndex;
            let type = matches.groups.type.toLocaleUpperCase().replace(" ", "-");
            let name= matches.groups.payload;
            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));
        
            switch (type) {
                case "MESSAGE-GROUP":                     
                    symbol = new vscode.DocumentSymbol(
                        name,
                        type,
                        vscode.SymbolKind.Array,
                        range,
                        range
                    );                  
                    console.timeLog("message", `\tFound Message Group ${name}`)  ;
                    this.symbols.push(symbol);
                    break;

                case "MESSAGE":
                    if(name.length===0) {
                        name = symbol.name;
                    } else {
                        child = new vscode.DocumentSymbol(
                            name,
                            type,
                            vscode.SymbolKind.String,
                            range,
                            range
                        );
                        console.timeLog("message", `\tFound Message ${name}`)  ;
                        symbol.children.push(child);
                    }
                    break;

                case "TEXT":
                    if(child) {
                        child.detail = name;
                    } else if(symbol) {
                        symbol.detail = name;
                        symbol.selectionRange = range;
                    }
                    break;

                default: 
                    break;
            }

        }
    }

}
