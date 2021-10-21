
import * as vscode from 'vscode';
import { downloadAndUnzipVSCode } from 'vscode-test';
import { DataStoreUnit, Structure, Table, View } from './structure';


declare global {
    export interface String {
        capitalize(): string;
    }
}

String.prototype.capitalize = function(): string {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };


export class StructureOutlineProvider implements vscode.DocumentSymbolProvider {
   
    private regexglobal: RegExp;
    private collectAttrib: RegExp;
    private linksTo: RegExp;
    private datatype: RegExp;
    private symbols: vscode.DocumentSymbol[];
    private structureItems: Structure;

    constructor() {
        console.time("structure"); 

        this.structureItems = new Structure();
        
        //globally parses the Structure.txt file.  Ignoring Comment lines and Blocks, then grouping major types, getting their name and sub attributes as a long string for later parsing.
        this.regexglobal = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)(?<groupType>sequence|table|field|view|collection|index|select_clause|oracle_specific_select|sqlserver_specific_select)[\s]+(?<Name>[_A-Za-z0-9]+)(?<AttribString>[(),'`<>-\s\[=\]_.\d$+/*A-Za-z]*);/gi;

        //Field or table attribute regex syntaxes.
        this.collectAttrib = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)\bon\b\s+(?<collectTable>[a-zA-Z_]+)\s+(\busing\b)\s+(?<collectField>[a-zA-Z_]+)[^\s\n]/gi;
        this.linksTo = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)(?<linkType>\blinks_to\b|\blinks_to parent\b)\s+(?<linkedTable>[a-zA-Z_]+)\s*[.]\s*(?<linkedField>[a-zA-Z_]+)/gi;
        this.datatype = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)datatype\s*(?<datatype>[a-zA-Z_]+)/gi;
    }

    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, reject) => 
        {
            this.symbols = [];

                this.parseDocument(document, null); 
            
            resolve(this.structureItems.dataItems);
        });
    }

    parseDocument(document: vscode.TextDocument, selection: vscode.Selection): void {
        
        if(this.structureItems.hash !== document.version){
            console.timeLog("structure", "\tparsing document");
            let regex = new RegExp(this.regexglobal);
            let matches: RegExpExecArray;
            let currentDataItem: DataStoreUnit;
            var scopedsymbol: vscode.DocumentSymbol;  
            var tablescope = true;    
            this.structureItems.hash = document.version;        
            
            while ((matches = regex.exec(document.getText())) !== null) {
                let selectionStart = matches.index;
                let selectionEnd = regex.lastIndex;
                let groupType = matches.groups.groupType.toLocaleLowerCase();
                let attributes = matches.groups.AttribString;
                let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                if (groupType === 'field' || groupType === 'index' || groupType === 'collection')
                {                               
                    tablescope = false;
                    let name = matches.groups.Name.toLocaleLowerCase();
                    console.timeLog("structure", `\tFound: ${groupType} - ${name}`);                   

                    if(groupType === 'field'){
                        let fieldsymbol = new vscode.DocumentSymbol(name, groupType.capitalize(), vscode.SymbolKind.Field, range, range);
                        scopedsymbol.children.push(fieldsymbol);

                        
                        //Work through different types of field attributes

                        //Datatype Attributes
                        let attribregex = new RegExp(this.datatype);
                        let attribmatches: RegExpExecArray;

                        while ((attribmatches = attribregex.exec(attributes)) !== null)
                        {
                            let selectionStart = matches.index;
                            let selectionEnd = regex.lastIndex;
                            let attribute = attribmatches.groups.datatype.toLocaleLowerCase();
                            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                            let attribsymbol = new vscode.DocumentSymbol(attribute, 'Datatype', vscode.SymbolKind.Variable, range, range);
                            fieldsymbol.children.push(attribsymbol);
                        }
                        //Links To Attributes
                        attribregex = new RegExp(this.linksTo);
                        
                        while ((attribmatches = attribregex.exec(attributes)) !== null)
                        {
                            let selectionStart = matches.index;
                            let selectionEnd = regex.lastIndex;
                            let attribute = `>${attribmatches.groups.linkedTable.toLocaleLowerCase()} >> ${attribmatches.groups.linkedField.toLocaleLowerCase()}`;
                            //let attribute = attribmatches.groups.linkedTable.toLocaleLowerCase();

                            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                            let attribsymbol = new vscode.DocumentSymbol(attribute, attribmatches.groups.linkType.toLocaleLowerCase().capitalize(), vscode.SymbolKind.Interface, range, range);
                            fieldsymbol.children.push(attribsymbol);                        
                        }
                    }
                    if(groupType === 'index')
                    {
                        let indexsymbol = new vscode.DocumentSymbol(name, groupType.capitalize(), vscode.SymbolKind.Struct, range, range);
                        scopedsymbol.children.push(indexsymbol);
                    }
                    if(groupType === 'collection')
                    {
                        let collectsymbol = new vscode.DocumentSymbol(name, groupType.capitalize(), vscode.SymbolKind.Object, range, range);
                        scopedsymbol.children.push(collectsymbol);

                        //Work through different types of field attributes

                        //Datatype Attributes
                        let attribregex = new RegExp(this.collectAttrib);
                        let attribmatches: RegExpExecArray;

                        while ((attribmatches = attribregex.exec(attributes)) !== null)
                        {
                            let selectionStart = matches.index;
                            let selectionEnd = regex.lastIndex;
                            let attribute = `>${attribmatches.groups.collectTable.toLocaleLowerCase()} >> ${attribmatches.groups.collectField.toLocaleLowerCase()}`;
                            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                            let attribsymbol = new vscode.DocumentSymbol(attribute, groupType, vscode.SymbolKind.Variable, range, range);
                            collectsymbol.children.push(attribsymbol);                        
                        }
                    }
                }
                if (groupType === 'select_clause' || groupType === 'oracle_specific_select' || groupType === 'sqlserver_specific_select')
                {
                    tablescope = false;                
                    console.timeLog("structure", `\tFound: ${groupType}`);   
                    let selectsymbol = new vscode.DocumentSymbol(groupType, 'Select Statement', vscode.SymbolKind.TypeParameter, range, range);
                    scopedsymbol.children.push(selectsymbol);                
                }

                if (groupType === 'sequence')
                {
                    if(tablescope === false)
                    {
                        this.symbols.push(scopedsymbol);
                    }

                    let name = matches.groups.Name.toLocaleLowerCase();
                    console.timeLog("structure", `\tFound: ${groupType} - ${name}`);   
                    scopedsymbol = new vscode.DocumentSymbol(name, groupType.capitalize(), vscode.SymbolKind.File, range, range);
                }

                if (groupType === 'table' || groupType === 'view')
                {
                    //Commit any previous scope before starting a new one.
                    //Assumptions is that the previous entry was a field/ select statement, sequence, etc...
                    if(tablescope === false)
                    {
                        this.symbols.push(scopedsymbol);
                    }

                    let name = matches.groups.Name.toLocaleLowerCase();
                    console.timeLog("structure", `\tFound: ${groupType} - ${name}`);      
                    console.timeLog("structure", `\tStarting New symbol: ${groupType} - ${name}`);  
                    scopedsymbol = new vscode.DocumentSymbol(name, groupType.capitalize(), vscode.SymbolKind.Key, range, range);
                    
                    if(groupType === "table"){
                        console.debug(`Creating Table ${name}`);
                        currentDataItem = new Table(name, groupType.capitalize(), range, range);         
                        this.structureItems.addDataItem(currentDataItem);
                    }
                    if(groupType === "view"){
                        console.debug(`Creating View ${name}`);
                        currentDataItem = new View(name, groupType.capitalize(), range, range);         
                        this.structureItems.addDataItem(currentDataItem);
                    }

                    tablescope = true;               
                }
            }

            //Commit the final scope
            this.symbols.push(scopedsymbol);
        }
    }

    private hashCode(str: string): number {
        var h: number = 0;
        for (var i = 0; i < str.length; i++) {
            h = 31 * h + str.charCodeAt(i);
        }
        return h & 0xFFFFFFFF;
    }
}