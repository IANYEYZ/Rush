marked = require('marked')
fs = require('fs')
path = require('path')

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

traverse('./style', (filePath) => {
    console.log(filePath)
    css = fs.readFileSync(filePath, (err) => {})
    fs.writeFileSync(`gen/style/${filePath.slice('style\\'.length)}`, css, (err) => {})
})
traverse('./static', (filePath) => {
    console.log(filePath)
    css = fs.readFileSync(filePath, (err) => {})
    fs.writeFileSync(`gen/assets/${filePath.slice('static\\'.length)}`, css, (err) => {})
})
traverse('./scripts', (filePath) => {
    console.log(filePath)
    css = fs.readFileSync(filePath, (err) => {})
    fs.writeFileSync(`gen/scripts/${filePath.slice('script\\'.length)}`, css, (err) => {})
})

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

if ('global' in config) {
    if ('highlight' in config['global']) {
        highlight = true
        defaultStyle = config['global']['highlight']
    }
}

for (key in config) {
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
    hlight = ('style' in fileConfig) || highlight
    hstyle = defaultStyle
    if ('highlight' in fileConfig) {
        hstyle = fileConfig['highlight']
    }
    addCode = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${hstyle}.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<!-- and it's easy to individually load additional languages -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/go.min.js"></script>

<script>hljs.highlightAll();</script>`
    if (fileConfig['page'].endsWith('js')){
        const genFunc = eval(page)
        html = genFunc(data)
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