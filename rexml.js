//////     JSXML XML Tools - REXML                /////////////
//////     Regular Expression-based XML parser    /////////////
//////     Ver 1.2 Jun 18 2001                    /////////////
//////     Copyright 2000 Peter Tracey            /////////////
//////     http://jsxml.homestead.com/            /////////////

function REXML(XML) {
	this.XML = XML;

	this.rootElement = null;

	this.parse = REXML_parse;
	if (this.XML && this.XML != "") this.parse();
}

	function REXML_parse() {
		var reTag = new RegExp("<([^>/ ]*)([^>]*)>","g"); // matches that tag name $1 and attribute string $2
		var reTagText = new RegExp("<([^>/ ]*)([^>]*)>([^<]*)","g"); // matches tag name $1, attribute string $2, and text $3
		var strType = "";
		var strTag = "";
		var strText = "";
		var strAttributes = "";
		var strOpen = "";
		var strClose = "";
		var iElements = 0;
		var xmleLastElement = null;
		if (this.XML.length == 0) return;
		var arrElementsUnparsed = this.XML.match(reTag);
		var arrElementsUnparsedText = this.XML.match(reTagText);
		var i=0;
		if (arrElementsUnparsed[0].replace(reTag, "$1") == "?xml") i++;

		for (; i<arrElementsUnparsed.length; i++) {
			strTag = arrElementsUnparsed[i].replace(reTag,"$1");
			strAttributes = arrElementsUnparsed[i].replace(reTag,"$2");
			strText = arrElementsUnparsedText[i].replace(reTagText,"$3").replace(/[\r\n\t ]+/g, " "); // remove white space
			strClose = "";
			if (strTag.indexOf("![CDATA[") == 0) {
				strOpen = "<![CDATA[";
				strClose = "]]>";
				strType = "cdata";
			} else if (strTag.indexOf("!--") == 0) {
				strOpen = "<!--";
				strClose = "-->";
				strType = "comment";
			} else if (strTag.indexOf("?") == 0) {
				strOpen = "<?";
				strClose = "?>";
				strType = "pi";
			} else strType = "element";
			if (strClose != "") {
				strText = "";
				if (arrElementsUnparsedText[i].indexOf(strClose) > -1) strText = arrElementsUnparsedText[i];
				else {
					for (; i<arrElementsUnparsed.length && arrElementsUnparsedText[i].indexOf(strClose) == -1; i++) {
						strText += arrElementsUnparsedText[i];
					}
					strText += arrElementsUnparsedText[i];
				}
				if (strText.substring(strOpen.length, strText.indexOf(strClose)) != "")	{
					xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement(strType, "","",xmleLastElement,strText.substring(strOpen.length, strText.indexOf(strClose)));
					if (strType == "cdata") xmleLastElement.text += strText.substring(strOpen.length, strText.indexOf(strClose));
				}
				if (strText.indexOf(strClose)+ strClose.length < strText.length) {
					xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "","",xmleLastElement,strText.substring(strText.indexOf(strClose)+ strClose.length, strText.length));
					if (strType == "cdata") xmleLastElement.text += strText.substring(strText.indexOf(strClose)+ strClose.length, strText.length);
				}
				continue;
			}
			if (strText.replace(/ */, "") == "") strText = "";
			if (arrElementsUnparsed[i].substring(1,2) != "/") {
				if (iElements == 0) {
					xmleLastElement = this.rootElement = new REXML_XMLElement(strType, strTag,strAttributes,null,strText);
					iElements++;
					if (strText != "") xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "","",xmleLastElement,strText);
				} else if (arrElementsUnparsed[i].substring(arrElementsUnparsed[i].length-2,arrElementsUnparsed[i].length-1) != "/") {
					xmleLastElement = xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement(strType, strTag,strAttributes,xmleLastElement,strText);
					iElements++;
					if (strText != "") xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "","",xmleLastElement,strText);
				} else {
					xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement(strType, strTag,strAttributes,xmleLastElement,strText);
					if (strText != "") xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "","",xmleLastElement,strText);
				}
			} else {
				xmleLastElement = xmleLastElement.parentElement;
				iElements--;
				if (xmleLastElement && strText != "") {
					xmleLastElement.text += strText;
					xmleLastElement.childElements[xmleLastElement.childElements.length] = new REXML_XMLElement("text", "","",xmleLastElement,strText);
				}
			}
		}
	}

	function REXML_XMLElement(strType, strName, strAttributes, xmlParent, strText) {
		this.type = strType;
		this.name = strName;
		this.attributeString = strAttributes;
		this.attributes = null;
		this.childElements = new Array();
		this.parentElement = xmlParent;
		this.text = strText; // text of element

		this.getText = REXML_XMLElement_getText; // text of element and child elements
		this.childElement = REXML_XMLElement_childElement;
		this.attribute = REXML_XMLElement_attribute;
	}

		function REXML_XMLElement_getText() {
			if (this.type == "text" || this.type == "cdata") {
				return this.text;
			} else if (this.childElements.length) {
				var L = "";
				for (var i=0; i<this.childElements.length; i++) {
					L += this.childElements[i].getText();
				}
				return L;
			} else return "";
		}
		
		function REXML_XMLElement_childElement(strElementName) {
			for (var i=0; i<this.childElements.length; i++) if (this.childElements[i].name == strElementName) return this.childElements[i];
			return null;
		}

		function REXML_XMLElement_attribute(strAttributeName) {
			if (!this.attributes) {
				var reAttributes = new RegExp(" ([^= ]*)=","g"); // matches attributes
				if (this.attributeString.match(reAttributes) && this.attributeString.match(reAttributes).length) {
					var arrAttributes = this.attributeString.match(reAttributes);
					if (!arrAttributes.length) arrAttributes = null;
					else for (var j=0; j<arrAttributes.length; j++) {
						arrAttributes[j] = new Array(
							(arrAttributes[j]+"").replace(/[= ]/g,""),
							ParseAttribute(this.attributeString, (arrAttributes[j]+"").replace(/[= ]/g,""))
										);
					}
					this.attributes = arrAttributes;
				}
			}
			if (this.attributes) for (var i=0; i<this.attributes.length; i++) if (this.attributes[i][0] == strAttributeName) return this.attributes[i][1];
			return "";
		}

function ParseAttribute(str,Attribute) {
	var str = str +  ">";
	if (str.indexOf(Attribute + "='")>-1) var Attr = new RegExp(".*" + Attribute + "='([^']*)'.*>");
	else if (str.indexOf(Attribute + '="')>-1) var Attr = new RegExp(".*" + Attribute + '="([^"]*)".*>');
	return str.replace(Attr, "$1");
}
