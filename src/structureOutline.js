"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructureOutlineProvider = void 0;
const { match } = require("assert");
const  {Console, table}  = require("console");
const vscode = require("vscode");

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
  }


class StructureOutlineProvider {
    constructor() {
        console.time("structure");

        //globally parses the Structure.txt file.  Ignoring Comment lines and Blocks, then grouping major types, getting their name and sub attributes as a long string for later parsing.
        this.regexglobal = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)(?<GroupType>sequence|table|field|view|collection|index|select_clause|oracle_specific_select|sqlserver_specific_select)[\s]+(?<Name>[_A-Za-z]+)(?<AttribString>[(),'`<>-\s\[=\]_.\d$+/*A-Za-z]*);/gi;

                //Field or table attribute regex syntaxes.
                this.linksTo = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)\blinks_to\s+(?<linkedTable>[a-zA-Z_]+)[\s.]+(?<linkedField>[a-zA-Z_]+)\b/gi;
                this.alias = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)\balias\s+(?<alias>[a-zA-Z_]+)\b/gi;
                this.datatype = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)datatype\s*(?<datatype>[a-zA-Z_]+)/gi;
                this.usedFor = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)\bused_for\s+(?<usedforName>[a-zA-Z_]+)\b/gi;
                this.linksToParentAlias = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)links_to\s+(parent)*\s*(?<linkedTable>[a-zA-Z_]+)[\s.]+\s(?<linkedField>[a-zA-Z_]+)\s+(as)\s+(?<aliasAs>[a-zA-Z_]+)[\n;]/gi;
                this.linksToSimple = /(?<!{(?:(?!})[\s\S\r])*?)(?<!{\*(?:(?!\*})[\s\S\r])*?)links_to\s+(?!parent)(?<linkedTable>[a-zA-Z_]+)[\s.]+(?<linkedField>[a-zA-Z_]+)\s*(?<!as)[\t\r\n;]/gi;
    }
    provideDocumentSymbols(document, token) {
        return new Promise((resolve, reject) => {
            this.symbols = [];
           this.parseDocument(document);
           resolve(this.symbols);
        });
    }




    //
    parseDocument(document) {
        console.timeLog("structure", "\tparsing document");
        let regex = new RegExp(this.regexglobal);
        let matches;
        var scopedsymbol;  
        var tablescope = true;
    
        
        while ((matches = regex.exec(document.getText())) !== null) {
            let selectionStart = matches.index;
            let selectionEnd = regex.lastIndex;
            let GroupType = matches.groups.GroupType.toLocaleLowerCase();
            let Attributes = matches.groups.AttribString;
            let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));


             if (GroupType === 'field' || GroupType === 'index')
            {
                               
                tablescope = false;

                let Name = matches.groups.Name.toLocaleLowerCase();
                console.timeLog("structure", `\tFound: ${GroupType} - ${Name}`);   


                if(GroupType === 'field'){
                    let fieldsymbol = new vscode.DocumentSymbol(Name, GroupType.capitalize(), vscode.SymbolKind.Field, range, range);
                    scopedsymbol.children.push(fieldsymbol);


                    //Work through different types of field attributes

                    //Datatype Attributes
                    let attribregex = new RegExp(this.datatype);
                    let attribmatches;

                    while ((attribmatches = attribregex.exec(Attributes)) !== null)
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
                    
                    while ((attribmatches = attribregex.exec(Attributes)) !== null)
                    {
                        let selectionStart = matches.index;
                        let selectionEnd = regex.lastIndex;
                        let attribute = `Table:${attribmatches.groups.linkedTable.toLocaleLowerCase()} -> Field:${attribmatches.groups.linkedField.toLocaleLowerCase()}`;
                        //let attribute = attribmatches.groups.linkedTable.toLocaleLowerCase();

                        let range = new vscode.Range(document.positionAt(selectionStart), document.positionAt(selectionEnd));

                        let attribsymbol = new vscode.DocumentSymbol(attribute, 'Links To', vscode.SymbolKind.Interface, range, range);
                        fieldsymbol.children.push(attribsymbol);
                        
                    }



                }
                if(GroupType === 'index')
                {
                    let indexsymbol = new vscode.DocumentSymbol(Name, GroupType.capitalize(), vscode.SymbolKind.Struct, range, range);
                    scopedsymbol.children.push(indexsymbol);
                }



            }
            if (GroupType === 'select_clause' || GroupType === 'oracle_specific_select' || GroupType === 'sqlserver_specific_select')
            {

                tablescope = false;
                
                console.timeLog("structure", `\tFound: ${GroupType}`);   

                let selectsymbol = new vscode.DocumentSymbol(GroupType, 'Select Statement', vscode.SymbolKind.TypeParameter, range, range);

                scopedsymbol.children.push(selectsymbol);


                
            }
            


            if (GroupType === 'sequence')
            {
                if(tablescope === false)
                {
                    this.symbols.push(scopedsymbol);
                }

                let Name = matches.groups.Name.toLocaleLowerCase();
                console.timeLog("structure", `\tFound: ${GroupType} - ${Name}`);   
                scopedsymbol = new vscode.DocumentSymbol(Name, GroupType.capitalize(), vscode.SymbolKind.File, range, range);
                

            }

            if (GroupType === 'table' || GroupType === 'view')
            {

                //Commit any previous scope before starting a new one.
                //Assumptions is that the previous entry was a field/ select statement, sequence, etc...
                if(tablescope === false)
                {
                    this.symbols.push(scopedsymbol);
                }


                let Name = matches.groups.Name.toLocaleLowerCase();
                console.timeLog("structure", `\tFound: ${GroupType} - ${Name}`);      

                console.timeLog("structure", `\tStarting New symbol: ${GroupType} - ${Name}`);  
                scopedsymbol = new vscode.DocumentSymbol(Name, GroupType.capitalize(), vscode.SymbolKind.Key, range, range);
                
                tablescope = true;


                
            }





        }

        //Commit the final scope
        this.symbols.push(scopedsymbol);





    }
}
exports.StructureOutlineProvider = StructureOutlineProvider;
//# sourceMappingURL=structureOutline.js.map