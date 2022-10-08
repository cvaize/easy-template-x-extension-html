# easy-template-x-extension-html

An extension for the easy-template-x package that allows you to use html to style content in a document.

At this stage of development, 4 tags are correctly understood and converted: `<br>`, `<b></b>`, `<i></i>`, `<u></u>`.

Leave your suggestions for adding tags in issue GitHub.

`npm i easy-template-x-extension-html`

```javascript
const fs = require('fs');
const {
    ImagePlugin,
    LinkPlugin,
    LoopPlugin,
    TextPlugin,
    RawXmlPlugin,
    TemplateHandler,
} = require('easy-template-x')
const HtmlPlugin = require('easy-template-x-extension-html');

const handler = new TemplateHandler({
    plugins: [new LoopPlugin(), new RawXmlPlugin(), new ImagePlugin(), new LinkPlugin(), new TextPlugin(), new HtmlPlugin()],
})

// 1. read template file
const templateFile = fs.readFileSync('myTemplate.docx');

// 2. process the template
const data = {
    posts: [
        { 
            author: 'Alon Bar',
            text: 'Forgot to mention that...',
            content: {
                _type: 'html',
                html: '<b>Raw html plugin</b><br><br/><i>- italics</i><br><u>- underline</u><br><b>- bold</b>'
            } 
        },
        { 
            author: 'Alon Bar', 
            text: 'Forgot to mention that...',
            content: 'Simple text'
        }
    ]
};

const handler = new TemplateHandler();
const doc = await handler.process(templateFile, data);

// 3. save output
fs.writeFileSync('myTemplate - output.docx', doc);
```


```text
Build "easy-template-x-extension-html" to dist:
       1692 B: index.cjs.gz
       1507 B: index.cjs.br
       1660 B: index.modern.js.gz
       1493 B: index.modern.js.br
       1691 B: index.module.js.gz
       1517 B: index.module.js.br
       1776 B: index.umd.js.gz
       1577 B: index.umd.js.br
```
