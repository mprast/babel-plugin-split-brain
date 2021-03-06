export default function ({ types: t }) {
    const visitor = {
        JSXElement(path){
            const name = path.node.openingElement.name;
            if (t.isJSXMemberExpression(name)){
                const fullyQualified = `${name.object.name}.${name.property.name}`;

                if (fullyQualified == "SplitBrain.Chunk"){
                    const children = getChildren(path);
                    const importObject = buildImportObject(path);

                    const innerFunction = buildInnerFunction(children, importObject, t);
                    
                    // when SplitBrain is disabled, we don't want to do any code splitting 
                    // at all. this means we need to 1) not add a require.ensure(), 
                    // 2) change the wrapper element from SplitBrain.Chunk_Intermediate to 
                    // SplitBrain.Passthrough, which will just return the children as-is.
                    if (this.opts.disabled){
                        const callExp = t.callExpression(innerFunction, []);
                        const jsxEc = t.jSXExpressionContainer(callExp);
                        const element = buildJSXElement("SplitBrain", "Passthrough", [jsxEc]);
                        path.replaceWith(element);
                        return;
                    }

                    // SplitBrain.Chunk_Intermediate needs to be imported 
                    // from split-brain-core for this to work
                    const sbi = buildSBIComponent(importObject, innerFunction, t);
                    path.replaceWith(sbi);                                  
                }
            }
            // pass-through
        }
    };

    function getChildren(path) {
        const children = path.node.children;
        const isNotJSXWhitespace = function(obj){
            return obj.type != "JSXText" || obj.value.trim() != "";
        };
        const childrenNoWhitespace = children.filter(isNotJSXWhitespace);

        if (childrenNoWhitespace.length != 1){
            var errC = "A Chunk element should have exactly one child.";
            throw path.buildCodeFrameError(errC); 
        }

        var child = childrenNoWhitespace[0];

        // a JSXExpressionContainer should be reduced to just its inner 
        // expression (since we're going to wrap the whole thing in 
        // another expression container anyway
        if (t.isJSXExpressionContainer(child)) {
            child = child.expression;
        }

        return child;
    }

    function buildImportObject(path) {
        // get import object and validate
        const attributes = path.node.openingElement.attributes;
        if (attributes.length != 1){
            var errA = "A Chunk element should have exactly one attribute, ";
            errA += "containing an 'import object' (cf. the SplitBrain readme).";
            throw path.buildCodeFrameError(errA);
        }
        
        const firstAttr = attributes[0].value;
        if (!t.isJSXExpressionContainer(firstAttr)){
            var errFa = "A Chunk element's attribute should be an expression ";
            errFa += "container, i.e. it should be wrapped in '{}'.";
            throw path.buildCodeFrameError(errFa);
        }

        const objExp = firstAttr.expression;
        if (!t.isObjectExpression(objExp)){
            var errO = "A Chunk element's attribute should be an object ";
            errO += "(cf. the SplitBrain readme).";
            throw path.buildCodeFrameError(errO);
        }

        const objProps = objExp.properties;
        if (Object.keys(objProps).length == 0){
            var errOe = "A Chunk element's attribute cannot be empty.";
            throw path.buildCodeFrameError(errOe);
        }
        
        const isStringProp = function (prop){
            return prop.key.type == "StringLiteral" && prop.value.type == "StringLiteral";
        }; 

        if (!objProps.every(isStringProp)){
            var errOs = "A Chunk element's attribute must have strings for all keys ";
            errOs += "and values.";
            throw path.buildCodeFrameError(errOs);
        }

        const importObject = {};
        objProps.forEach((prop) => importObject[prop.key.value] = prop.value.value);
    
        return importObject;
    }

    function buildInnerFunction(children, importObject, t){
        const requires = buildRequireStatements(importObject, t);
        const block = t.BlockStatement([...requires, t.returnStatement(children)]); 
        return t.functionExpression(null, [], block);
    }

    function buildRequireStatements(importObject){
        return Object.keys(importObject).map(function(key){
            const val = importObject[key];
            const left = t.identifier(key);
            const reqIdent = t.identifier("require");
            const argIdent = t.stringLiteral(val);
            const rightCall = t.callExpression(reqIdent, [argIdent]);
            const right = t.memberExpression(rightCall, t.identifier("default"));
            const declarator = t.variableDeclarator(left, right);
            return t.variableDeclaration("var", [declarator]);
        }); 
    }

    // the point of this JSX plugin is to replace SplitBrain.Chunk with 
    // SplitBrain.Chunk_Intermediate. This builds SplitBrain.Chunk_Intermediate
    // given SplitBrain.Chunk's children, and the list of modules that need to 
    // be required for them
    // 
    // TODO(mprast): investigate using Babylon to generate the AST for 
    // this (see if it'll affect build time at all)
    function buildSBIComponent(importObject, innerFunction){
        // we want to pass a promise (and not React 
        // elements) to this new element via props.children. 
        // require.ensure will create the promise for us. 
        // SplitBrain.Chunk_Intermediate will call it in 
        // its render argument.
        const importVals = Object.keys(importObject).map((key) => importObject[key]);
        const wrapper = buildEnsureWrapper(importVals, t);
        const innerExp = t.jSXExpressionContainer(wrapper(innerFunction, t));

        return buildJSXElement("SplitBrain", "Chunk_Intermediate", [innerExp]);
    }

    function buildEnsureWrapper(modules){
        const id1 = t.identifier("require");
        const id2 = t.identifier("ensure");
        const member = t.memberExpression(id1, id2);
        const literals = t.arrayExpression(modules.map((module) => t.stringLiteral(module)));
        
        const wrapper = function(ensureFunction, t) {
            const ensure = t.callExpression(member, [literals, ensureFunction]);
            return ensure;
        };
        
        return wrapper;
    }

    function buildJSXElement(namespace, name, children){
        const namePartOne = t.jSXIdentifier(namespace);
        const namePartTwo = t.jSXIdentifier(name);
        const memberExp = t.jSXMemberExpression(namePartOne, namePartTwo);
        const opener = t.jSXOpeningElement(memberExp, []);
        const closer = t.jSXClosingElement(memberExp);
        
        return t.jSXElement(
            opener,
            closer,
            children,
            false
        );
    }

    return {
        inherits: require("babel-plugin-syntax-jsx"),
        visitor: visitor
    };
}
