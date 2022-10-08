const {
    DocxParser,
    XmlTextNode,
    XmlGeneralNode,
    TextPlugin,
    XmlNode,
    stringValue,
} = require('easy-template-x')

function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }

    return obj;
}


const stripTags = (input, allowed) => {
    allowed = allowed.map(s => s.toLowerCase())
    const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    return input.replace(tags, ($0, $1) => allowed.includes($1.toLowerCase()) ? $0 : '');
}

let allowedTags = new Set(['b', 'i', 'u']);

class HtmlObject {
    /**
     * @type {Set<string>}
     */
    static allowedWrapTags = allowedTags

    /**
     * @param {string} text
     * @param {HtmlObject[]} children
     * @param {HtmlObject} parent
     * @param {Set<string>} wrapTags
     */
    constructor(text, children = [], parent = null, wrapTags = null) {
        this.text = text;
        this.children = children;
        this.parent = parent;
        this.wrapTags = wrapTags ?? new Set([]);
    }

    /**
     * @param {string} str
     * @param {string} tagName
     * @returns {number}
     */
    static getOpenTagIndex(str, tagName) {
        return str.search(new RegExp(`<${tagName}[^>]*>`, 'gi'))
    }

    /**
     * @param {string} str
     * @param {string} tagName
     * @returns {number}
     */
    static getCloseTagIndex(str, tagName) {
        return str.search(new RegExp(`<\/${tagName}[^>]*>`, 'gi'))
    }

    static addOrPushToArray(array, index, string) {
        if (array[index]) array[index] += string;
        else array.push(string)
        return array;
    }

    static splitTextByTags(text) {
        let strings = [];
        let stringIndex = -1;
        let breakIterator = 0
        let breakIteratorMax = text.length
        while (!!text) {
            breakIterator++; // Bug Security
            if (breakIterator > breakIteratorMax) break;

            let tagName = '';
            let openTagIndex = -1;

            for (const allowedWrapTag of HtmlObject.allowedWrapTags) {
                let newIndex = HtmlObject.getOpenTagIndex(text, allowedWrapTag)
                if (openTagIndex === -1 || (openTagIndex > newIndex && newIndex !== -1)) {
                    openTagIndex = newIndex;
                    tagName = allowedWrapTag;
                }
            }

            if (openTagIndex !== -1) {
                let subText = text.slice(0, openTagIndex);
                if (subText) {
                    stringIndex++;
                    HtmlObject.addOrPushToArray(strings, stringIndex, subText)
                    text = text.slice(openTagIndex, text.length);
                }

                subText = text.slice(0, text.indexOf('>') + 1);
                stringIndex++;
                HtmlObject.addOrPushToArray(strings, stringIndex, subText)
                text = text.slice(subText.length, text.length);

                while (!!text) {
                    breakIterator++; // Bug Security
                    if (breakIterator > breakIteratorMax) break;

                    let newOpenIndex = HtmlObject.getOpenTagIndex(text, tagName)
                    let newCloseIndex = HtmlObject.getCloseTagIndex(text, tagName)

                    if (newCloseIndex === -1) {
                        HtmlObject.addOrPushToArray(strings, stringIndex, text)
                        text = '';
                        break;
                    } else {
                        let isBreak = newOpenIndex === -1 || newOpenIndex > newCloseIndex

                        subText = text.slice(0, newCloseIndex);
                        HtmlObject.addOrPushToArray(strings, stringIndex, subText)
                        text = text.slice(newCloseIndex, text.length);

                        subText = text.slice(0, text.indexOf('>') + 1);
                        HtmlObject.addOrPushToArray(strings, stringIndex, subText)
                        text = text.slice(subText.length, text.length);

                        if (isBreak) {
                            break;
                        }
                    }
                }

                if (text) {
                    let isNeedNext = false

                    for (const allowedWrapTag of HtmlObject.allowedWrapTags) {
                        let newIndex = HtmlObject.getOpenTagIndex(text, allowedWrapTag)
                        if (newIndex !== -1) {
                            isNeedNext = true;
                        }
                    }
                    if (!isNeedNext) {
                        stringIndex++;
                        HtmlObject.addOrPushToArray(strings, stringIndex, text)
                        text = '';
                    }
                }

            } else {
                HtmlObject.addOrPushToArray(strings, stringIndex, text)
                text = '';
            }
        }
        return strings;
    }

    build() {
        let text = this.text;
        this.wrapTags = this.parent ? new Set(Array.from(this.parent.wrapTags)) : new Set([])

        let strings = [];
        let isWhile = true;

        while (isWhile) {
            strings = HtmlObject.splitTextByTags(text);
            let str = strings[0];
            if (strings.length === 1 && str[0] === '<' && str[str.length - 1] === '>') {

                let tagName = null;
                let openTagIndex = -1;

                for (const allowedWrapTag of HtmlObject.allowedWrapTags) {
                    let newIndex = HtmlObject.getOpenTagIndex(str, allowedWrapTag)
                    if (openTagIndex === -1 || (openTagIndex > newIndex && newIndex !== -1)) {
                        openTagIndex = newIndex;
                        tagName = allowedWrapTag;
                    }
                }

                if (tagName && openTagIndex === 0) {

                    this.wrapTags.add(tagName);

                    text = str.slice(str.indexOf('>') + 1, str.length - tagName.length - 3);

                } else {
                    isWhile = false;
                }
            } else {
                isWhile = false;
            }
        }

        if (strings.length === 1 && strings[0] === this.text) {
            return this
        }

        let isNeedBuild = false;

        for (const allowedWrapTag of HtmlObject.allowedWrapTags) {
            let newIndex = HtmlObject.getOpenTagIndex(text, allowedWrapTag)
            if (newIndex !== -1) {
                isNeedBuild = true;
                break;
            }
        }

        this.children = [];
        for (let i = 0; i < strings.length; i++) {
            const htmlObject = new HtmlObject(strings[i], [], this, new Set(Array.from(this.wrapTags)))
            isNeedBuild && htmlObject.build();
            this.children.push(htmlObject)
        }

        return this;
    }
}

class HtmlPlugin extends TextPlugin {
    constructor(...args) {
        super(...args);

        _defineProperty(this, "contentType", 'html');
    }

    /**
     * Replace the node text content with the specified value.
     */
    simpleTagReplacements(tag, data) {
        const value = data.getScopeData();
        let str = stringValue(value.html).replace(/<br\s*\/?>/gi, '\n');
        str = stripTags(str, Array.from(allowedTags)).trim()

        const htmlObject = new HtmlObject(str)
        htmlObject.build()

        const paragraphNode = this.utilities.docxParser.containingParagraphNode(tag.xmlTextNode); // first line
        const runNode = this.utilities.docxParser.containingRunNode(tag.xmlTextNode); // first line
        let runPropNode = this.findChildByName(runNode, DocxParser.RUN_PROPERTIES_NODE);

        if (!runPropNode) {
            runPropNode = XmlNode.createGeneralNode(DocxParser.RUN_PROPERTIES_NODE);
            runPropNode.attributes = {}
            runPropNode.childNodes = []
            runPropNode.parentNode = runNode;
        }

        this.createRun(htmlObject, tag.xmlTextNode, runNode, runPropNode, paragraphNode)

        paragraphNode.childNodes = paragraphNode.childNodes.filter(n => n !== runNode)
    }

    /**
     * @param {HtmlObject} htmlObject
     * @param {XmlTextNode} textNode
     * @param {XmlGeneralNode} runNode
     * @param {XmlGeneralNode} runPropNode
     * @param {XmlGeneralNode} paragraphNode
     */
    createRun(htmlObject, textNode, runNode, runPropNode, paragraphNode) {
        if (htmlObject.children.length === 0) {
            if (htmlObject.text) {
                const str = htmlObject.text;

                const newRunNode = XmlNode.createGeneralNode(DocxParser.RUN_NODE);
                const newRunPropNode = XmlNode.createGeneralNode(DocxParser.RUN_PROPERTIES_NODE);

                newRunNode.parentNode = runNode.parentNode;
                this.copyAttributes(runNode, newRunNode);

                this.copyAttributes(runPropNode, newRunPropNode);

                for (let i = 0; i < runPropNode.childNodes.length; i++) {
                    const propertyRunPropNode = runPropNode.childNodes[i]
                    const newPropertyRunPropNode = XmlNode.createGeneralNode(propertyRunPropNode.nodeName);

                    this.copyAttributes(propertyRunPropNode, newPropertyRunPropNode);
                    XmlNode.appendChild(newRunPropNode, newPropertyRunPropNode);
                }
                const BOLD_NODE = 'w:b'
                const COMPLEX_SCRIPT_BOLD_NODE = 'w:bCs'

                const ITALIC_NODE = 'w:i'
                const COMPLEX_SCRIPT_ITALIC_NODE = 'w:iCs'

                const UNDERLINE_NODE = 'w:u'

                if (htmlObject.wrapTags.has('b')) {
                    this.addProperty(newRunPropNode, BOLD_NODE)
                    this.addProperty(newRunPropNode, COMPLEX_SCRIPT_BOLD_NODE)
                }
                if (htmlObject.wrapTags.has('i')) {
                    this.addProperty(newRunPropNode, ITALIC_NODE)
                    this.addProperty(newRunPropNode, COMPLEX_SCRIPT_ITALIC_NODE)
                }
                if (htmlObject.wrapTags.has('u')) {
                    this.addProperty(newRunPropNode, UNDERLINE_NODE, {
                        'w:val': 'single'
                    })
                }

                XmlNode.appendChild(newRunNode, newRunPropNode);

                const lines = str.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i]

                    if (i > 0) {
                        // add line break
                        const lineBreak = this.getLineBreak();
                        XmlNode.appendChild(newRunNode, lineBreak); // add text
                    }

                    const lineNode = this.createWordTextNode(line);
                    XmlNode.appendChild(newRunNode, lineNode);
                }
                XmlNode.appendChild(paragraphNode, newRunNode);
            }
        } else {
            for (let i = 0; i < htmlObject.children.length; i++) {
                this.createRun(htmlObject.children[i], textNode, runNode, runPropNode, paragraphNode)
            }
        }
    }

    addProperty(propNode, nodeName, attributes = {}) {
        if (!propNode.childNodes.find(n => n.nodeName === nodeName)) {
            const node = XmlNode.createGeneralNode(nodeName);
            node.attributes = attributes;
            XmlNode.appendChild(propNode, node);
        }
    }

    /**
     * @param {XmlGeneralNode} node
     * @param {string} childName
     */
    findChildByName(node, childName) {
        if (!node) return null;
        return (node.childNodes || []).find(child => child.nodeName === childName);
    }

    /**
     * @param {XmlGeneralNode} fromNode
     * @param {XmlGeneralNode} toNode
     */
    copyAttributes(fromNode, toNode) {
        if (fromNode.attributes) {
            if (!toNode.attributes) toNode.attributes = {};
            for (const attributesKey in fromNode.attributes) {
                toNode.attributes[attributesKey] = fromNode.attributes[attributesKey];
            }
        }
    }

    getLineBreak() {
        return XmlNode.createGeneralNode('w:br');
    }

    createWordTextNode(text) {
        const wordTextNode = XmlNode.createGeneralNode(DocxParser.TEXT_NODE);
        wordTextNode.attributes = {};
        this.utilities.docxParser.setSpacePreserveAttribute(wordTextNode);
        wordTextNode.childNodes = [XmlNode.createTextNode(text)];
        return wordTextNode;
    }

}

module.exports = HtmlPlugin

