//////     JSXML XML Tools - REXML                /////////////
//////     Regular Expression-based XML parser    /////////////
//////     Ver 1.2 Jun 18 2001                    /////////////
//////     Copyright 2000 Peter Tracey            /////////////
//////     http://jsxml.homestead.com/            /////////////

function REXML(XML) {
    this.XML = XML;

    this.rootElement = null;

    this.parse = REXML_parse;
    if (this.XML && this.XML !== "") this.parse();
}

function REXML_parse() {
    const reTag = new RegExp("<([^>/ ]*)([^>]*)>", "g"); // matches that tag name $1 and attribute string $2
    const reTagText = new RegExp("<([^>/ ]*)([^>]*)>([^<]*)", "g"); // matches tag name $1, attribute string $2, and text $3
    let strType = "";
    let strTag = "";
    let strText = "";
    let strAttributes = "";
    let strOpen = "";
    let strClose = "";
    let iElements = 0;
    let xmleLastElement = null;
    if (this.XML.length === 0) return;
    const arrElementsUnparsed = this.XML.match(reTag);
    const arrElementsUnparsedText = this.XML.match(reTagText);
    let i = 0;
    if (arrElementsUnparsed[0].replace(reTag, "$1") === "?xml") i++;

    for (; i < arrElementsUnparsed.length; i++) {
        strTag = arrElementsUnparsed[i].replace(reTag, "$1");
        strAttributes = arrElementsUnparsed[i].replace(reTag, "$2");
        strText = arrElementsUnparsedText[i].replace(reTagText, "$3").replace(/[\r\n\t ]+/g, " "); // remove white space
        strClose = "";
        if (strTag.indexOf("![CDATA[") === 0) {
            strOpen = "<![CDATA[";
            strClose = "]]>";
            strType = "cdata";
        } else if (strTag.indexOf("!--") === 0) {
            strOpen = "<!--";
            strClose = "-->";
            strType = "comment";
        } else if (strTag.indexOf("?") === 0) {
            strOpen = "<?";
            strClose = "?>";
            strType = "pi";
        } else strType = "element";
        if (strClose !== "") {
            strText = "";
            if (arrElementsUnparsedText[i].indexOf(strClose) > -1) strText = arrElementsUnparsedText[i];
            else {
                for (; i < arrElementsUnparsed.length && arrElementsUnparsedText[i].indexOf(strClose) === -1; i++) {
                    strText += arrElementsUnparsedText[i];
                }
                strText += arrElementsUnparsedText[i];
            }
            if (strText.substring(strOpen.length, strText.indexOf(strClose)) !== "") {
                xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement(strType, "", "", xmleLastElement, strText.substring(strOpen.length, strText.indexOf(strClose)));
                if (strType === "cdata") xmleLastElement.text += strText.substring(strOpen.length, strText.indexOf(strClose));
            }
            if (strText.indexOf(strClose) + strClose.length < strText.length) {
                xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "", "", xmleLastElement, strText.substring(strText.indexOf(strClose) + strClose.length, strText.length));
                if (strType === "cdata") xmleLastElement.text += strText.substring(strText.indexOf(strClose) + strClose.length, strText.length);
            }
            continue;
        }
        if (strText.replace(/ */, "") === "") strText = "";
        if (arrElementsUnparsed[i].substring(1, 2) !== "/") {
            if (iElements === 0) {
                xmleLastElement = this.rootElement = new REXML_XMLElement(strType, strTag, strAttributes, null, strText);
                iElements++;
                if (strText !== "") xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "", "", xmleLastElement, strText);
            } else if (arrElementsUnparsed[i].substring(arrElementsUnparsed[i].length - 2, arrElementsUnparsed[i].length - 1) !== "/") {
                xmleLastElement = xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement(strType, strTag, strAttributes, xmleLastElement, strText);
                iElements++;
                if (strText !== "") xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "", "", xmleLastElement, strText);
            } else {
                xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement(strType, strTag, strAttributes, xmleLastElement, strText);
                if (strText !== "") xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "", "", xmleLastElement, strText);
            }
        } else {
            xmleLastElement = xmleLastElement.parentElement;
            iElements--;
            if (xmleLastElement && "" !== strText) {
                xmleLastElement.text += strText;
                xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "", "", xmleLastElement, strText);
            }
        }
    }
}

function REXML_XMLElement(strType, strName, strAttributes, xmlParent, strText) {
    this.type = strType;
    this.name = strName;
    this.attributeString = strAttributes;
    this.attributes = null;
    this.childElements = [];
    this.parentElement = xmlParent;
    this.text = strText; // text of element

    this.getText = REXML_XMLElement_getText; // text of element and child elements
    this.childElement = REXML_XMLElement_childElement;
    this.attribute = REXML_XMLElement_attribute;
}

/**
 * @return {string}
 */
function REXML_XMLElement_getText() {
    if (this.type === "text" || this.type === "cdata") {
        return this.text;
    } else if (this.childElements.length) {
        let L = "";
        for (let i = 0; i < this.childElements.length; i++) {
            L += this.childElements[i].getText();
        }
        return L;
    } else return "";
}

/**
 * @return {*}
 */
function REXML_XMLElement_childElement(strElementName) {
    for (let i = 0; i < this.childElements.length; i++) if (this.childElements[i].name === strElementName) return this.childElements[i];
    return null;
}

/**
 * @return {string}
 */
function REXML_XMLElement_attribute(strAttributeName) {
    if (!this.attributes) {
        let reAttributes = new RegExp(" ([^= ]*)=", "g"); // matches attributes
        if (this.attributeString.match(reAttributes) && this.attributeString.match(reAttributes).length) {
            let arrAttributes = this.attributeString.match(reAttributes);
            if (!arrAttributes.length) arrAttributes = null;
            else for (let j = 0; j < arrAttributes.length; j++) {
                arrAttributes[j] = [(arrAttributes[j] + "").replace(/[= ]/g, ""),
                    ParseAttribute(this.attributeString, (arrAttributes[j] + "").replace(/[= ]/g, ""))];
            }
            this.attributes = arrAttributes;
        }
    }
    if (this.attributes) for (let i = 0; i < this.attributes.length; i++) if (this.attributes[i][0] === strAttributeName) return this.attributes[i][1];
    return "";
}

/**
 * @return {string}
 */
function ParseAttribute(str_input, Attribute) {
    const str = str_input + ">";
    let Attr;
    if (str.indexOf(Attribute + "='") > -1) Attr = new RegExp(".*" + Attribute + "='([^']*)'.*>");
    else if (str.indexOf(Attribute + '="') > -1) Attr = new RegExp(".*" + Attribute + '="([^"]*)".*>');
    return str.replace(Attr, "$1");
}

