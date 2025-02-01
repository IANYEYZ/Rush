d => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${d.title}</title>
    <link rel="stylesheet" href="${d.toGlobal}style/proto.css"/>
</head>
<body>
    <header>
        <nav>
            <a href="/">
                <img alt="Rush" src="${d.toGlobal}assets/1F3CE.svg" height=70 />
            </a>
            <ul>
                <li><a href="/about">About</a></li>
            </ul>
        </nav>
        <h1>${d.title}</h1>
    </header>
    <main>
        ${d.content}
    </main>
</body>
</html>`