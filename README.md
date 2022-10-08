# easy-template-x-extension-html

An extension for the easy-template-x package that allows you to use html to style content in a document.

At this stage of development, 4 tags are correctly understood and converted: `<br>`, `<b></b>`, `<i></i>`, `<u></u>`.

Leave your suggestions for adding tags in issue GitHub.

`npm i easy-template-x-extension-html`

```javascript
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
```
