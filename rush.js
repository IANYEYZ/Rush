fs = require('fs')
path = require('path')
matter = require('gray-matter')

args = process.argv

bk = args[args.length - 1]

if (bk == "gen" || bk != "new") {
    const WriteFile = (dir, content) => {
        pathName = path.dirname(dir)
        if (fs.existsSync(dir)) {
            return
        }
        fs.mkdirSync(pathName, {recursive: true}, (err) => {})
        fs.writeFileSync(dir, content, 'utf8', (err) => {})
    }
    const traverse = (dir, callBack) => {
        files = fs.readdirSync(dir)

        files.forEach(file => {
            const filePath = path.join(dir, file)
            const stats = fs.statSync(filePath)

            if (stats.isDirectory()) {
                traverse(filePath, callBack)
            } else {
                callBack(filePath)
            }
        })
    }
    plugins = []
    const loadPlugins = () => {
        pluginList = fs.readFileSync("plugins/config", "utf-8").split('\n')
        for (pluginName of pluginList) {
            plugin = require(`./plugins/${pluginName}`)
            plugins.push(plugin)
        }
    }
    loadPlugins()
    const processTemplate = (content, data, type, path) => {
        for (i of plugins) {
            if (i.plugin.supportTemplateType.includes(type)) {
                res = i.plugin.parseTemplate(content, type, data, path)
                if (res[1]) {
                    content = res[0]
                } else {
                    return res[0]
                }
            }
        }
    }
    const parseContent = (content, type) => {
        for (i of plugins) {
            if (i.plugin.supportContentType.includes(type)) {
                res = i.plugin.parseContent(content, type)
                if (res[1]) {
                    content = res[0]
                } else {
                    return res[0]
                }
            }
        }
    }
    const afterProcess = (html) => {
        for (i of plugins) {
            if ('afterProcess' in i.plugin) {
                html = i.plugin.afterProcess(html)
            }
        }
        return html
    }

    /* Following code from:
    https://stackoverflow.com/questions/8496212/node-js-fs-unlink-function-causes-eperm-error */
    var deleteFolderRecursive = function(path) {
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file) {
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    deleteFolderRecursive('gen')

    fs.mkdirSync('gen', (err) => {})
    fs.mkdirSync('gen/style', (err) => {})
    fs.mkdirSync('gen/assets', (err) => {})
    fs.mkdirSync('gen/scripts', (err) => {})

    data_ = fs.readFileSync('config.json', 'utf-8')
    config = JSON.parse(data_)
    globalData = {}

    traverse('./style', (filePath) => {
        css = fs.readFileSync(filePath, (err) => {})
        fs.writeFileSync(`gen/style/${filePath.slice('style\\'.length)}`, css, (err) => {})
    })
    traverse('./static', (filePath) => {
        assets = fs.readFileSync(filePath, (err) => {})
        fs.writeFileSync(`gen/assets/${filePath.slice('static\\'.length)}`, assets, (err) => {})
    })
    traverse('./scripts', (filePath) => {
        script = fs.readFileSync(filePath, (err) => {})
        fs.writeFileSync(`gen/scripts/${filePath.slice('script\\'.length)}`, script, (err) => {})
    })
    traverse('./components', (filePath) => {
        js = fs.readFileSync(filePath, 'utf-8', (err) => {})
        componentName = filePath.slice('components\\'.length).split('.').slice(0, -1).join('.')
        if (componentName != "config" && componentName) {
            globalData[componentName] = js
        }
    })
    compOrders = Object.keys(globalData)
    compOrders = fs.readFileSync('components/config', 'utf-8', (err) => {}).split(/\n|\n\r|\r/).filter(item => item.length > 0)

    allCSS = {}
    for (key in config) { // Init Style
        if (!('style' in config[key])) continue;
        if (config[key]['style'] in allCSS) {
            continue
        } else {
            css = fs.readFileSync(`style/${config[key]['style']}`, (err) => {})
            fs.writeFileSync(`gen/${config[key]['style']}`, css, (err) => {})
        }
    }

    highlight = false
    defaultStyle = ""
    if ('global' in config) { // Global Highlight setting
        if ('highlight' in config['global']) {
            highlight = true
            defaultStyle = config['global']['highlight']
        }
    }

    for (key in config) { // Generating Pages
        if (key == 'global') continue;
        fileConfig = config[key]
        page = fs.readFileSync(`page/${fileConfig['page']}`, 'utf-8')
        content = fs.readFileSync(`content/${fileConfig['content']}`, 'utf-8')
        contentTyp = fileConfig['content'].substring(fileConfig['content'].lastIndexOf('.') + 1)
        val = matter(content)
        dataInMd = val["data"]
        content_ = val["content"]
        data = {
            'title': fileConfig['content'].substring(0, fileConfig['content'].lastIndexOf('.')),
            'content': parseContent(content_, contentTyp),
            ...dataInMd
        }
        dir = path.normalize(key).split(path.sep).filter(item => item.length > 0).length - 1
        res = "../"
        res = res.repeat(dir)
        data.toGlobal = res
        if ('data' in fileConfig) {
            data = {
                ...data,
                ...fileConfig['data']
            }
        }
        if ('styles' in fileConfig) {
            data.style = ""
            for (i of fileConfig['styles']) {
                data.style = /* html */`<link rel="stylesheet" href="${res + `style/` + i}">`
            }
        }
        if ('scripts' in fileConfig) {
            data.script = ""
            for (i of fileConfig['scripts']) {
                data.script = `<script src="${res + `scripts/` + i}" />`
            }
        }
        // Global components(what in the component folder) is always loaded for all pages
        // Pages as component are loaded as the order in config.json suggests
        globalData_ = globalData // Copy Global Data to process
        for (prop of compOrders) {
            comp = globalData_[prop]
            data[prop] = eval(comp) // More flexible
        }
        data = { // Load globalData_(components) into data
            ...globalData_,
            ...data
        }
        hlight = ('style' in fileConfig) || highlight
        hstyle = defaultStyle
        if ('highlight' in fileConfig) {
            hstyle = fileConfig['highlight']
        }
        addCode = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${hstyle}.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>`
        html = processTemplate(page, data, 'js', path)
        endPoint = html.lastIndexOf('</body>')
        if (hlight) html = html.slice(0, endPoint) + addCode + html.slice(endPoint)
        WriteFile(`gen/${key}.html`, afterProcess(html))
    }
} else if (bk == "new") {
    fs.mkdirSync("components")
    fs.writeFileSync("components/config", "", (err) => {})
    fs.mkdirSync("plugins")
    fs.writeFileSync("plugins/config", "standard.js", (err) => {})
    fs.writeFileSync("plugins/standard.js", `marked = require('marked')

exports.plugin = {
    supportContentType: ["md", "markdown"],
    supportTemplateType: ["js", "html"],
    parseContent(content, type) {
        return [marked.parse(content), false]
    },
    parseTemplate(content, type, data) {
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
    afterProcess(html) {
        return html
    }
};
`, (err) => {})
    fs.mkdirSync("content")
    fs.mkdirSync("page")
    fs.mkdirSync("scripts")
    fs.mkdirSync("style")
    fs.mkdirSync("static")
    fs.writeFileSync("config.json", "", (err) => {})
} else if (args[args.length - 2] == "plugin") {
    fs.writeFileSync(`plugins/${bk}.js`, `exports.plugin = {
    supportContentType: [],
    supportTemplateType: [],
    parseContent(content, type) {
    },
    parseTemplate(content, type, data) {
    },
    afterProcess(html) { return html }
};`, (err) => {})
}