const markedAlert = require('marked-alert');

marked = require('marked')

exports.plugin = {
    supportContentType: ["md", "markdown"],
    supportTemplateType: ["js", "html"],
    parseContent(content, type, path, config) {
        return [marked.use(markedAlert()).parse(content), false]
    },
    parseTemplate(content, type, data, path, config) {
        if (type == "js") {
            const genFunc = eval(content)
            html = genFunc(data)
            return [html, false]
        } else {
            const pattern = /\{\{(.*?)\}\}/g
            return [content.replace(pattern, (match, cont) => {
                d = data
                val = eval(cont)
                return val
            }), false]
        }
    },
    afterProcess(html, path, config) {
        return html
    }
};