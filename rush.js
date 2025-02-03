marked = require('marked')
fs = require('fs')
path = require('path')

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
    const processTemplate = (templ, data) => {
        const genFunc = eval(templ)
        html = genFunc(data)
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
    console.log(compOrders)

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
        data = {
            'title': fileConfig['content'].substring(0, fileConfig['content'].lastIndexOf('.')),
            'content': marked.parse(content)
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
        globalData_ = globalData // Copy Global Data to process
        console.log(globalData_)
        for (prop of compOrders) {
            comp = globalData_[prop]
            console.log(comp)
            genHTML = processTemplate(comp, data)
            console.log(genHTML)
            data[prop] = genHTML // This makes nesting components available
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
        if (fileConfig['page'].endsWith('js')){
            html = processTemplate(page, data)
            endPoint = html.lastIndexOf('</body>')
            if (hlight) html = html.slice(0, endPoint) + addCode + html.slice(endPoint)
            WriteFile(`gen/${key}.html`, html)
        } else if (fileConfig['page'].endsWith('html')) {
            const pattern = /\{\{(.*?)\}\}/g
            html = page.replace(pattern, (match, cont) => {
                d = data
                val = eval(cont)
                return val
            })
            if (hlight) html = html.slice(0, endPoint) + addCode + html.slice(endPoint)
            WriteFile(`gen/${key}.html`, html)
        }
    }
} else if (bk == "new") {
    fs.mkdirSync("components")
    fs.writeFileSync("components/config", "", (err) => {})
    fs.mkdirSync("content")
    fs.mkdirSync("page")
    fs.mkdirSync("scripts")
    fs.mkdirSync("style")
    fs.mkdirSync("static")
    fs.writeFileSync("config.json", "", (err) => {})
}