import * as vscode from 'vscode';
import * as express from 'express';
import * as path from 'path';

// Constants
const PORT = 3000;
const HOST = '127.0.0.1';

export async function activate(context: vscode.ExtensionContext) {
    // App
    const app = express();

    app.use('/static', express.static(path.resolve(__dirname, '..', 'public')));
    app.get('/', (req: any, res: any) => {
        console.log('Got request!');
        res.send('<html><body>Hello remote world!</body></html>');
    });
    app.get('/webview', (req: any, res: any) => {
        console.log('Got request! ' + req.originalUrl);
        res.send('<html><body>WebView test! <br/>' + req.originalUrl + '<br/> <img src="/static/images/test.jpg" /></body></html>');
    });

    app.listen(PORT, HOST);
    const serverUri = `http://${HOST}:${PORT}`
    console.log(`Running on "${serverUri}"!`);

    const openCommand = vscode.commands.registerCommand('webview-example.browser', () => {
        vscode.env.openExternal(vscode.Uri.parse(serverUri));
    });
    context.subscriptions.push(openCommand);

    const testCommand = vscode.commands.registerCommand('webview-example.demo', async () => {

        const fullWebServerUri = await (<any>vscode.env).asExternalUri(vscode.Uri.parse(serverUri)) as vscode.Uri;

        // Work around different issue where https not returned for browser-based editor
        const fullWebServerString =
            (['localhost', '127.0.0.1', '0.0.0.0'].indexOf(fullWebServerUri.authority.split(':')[0]) < 0) ?
                fullWebServerUri.toString().replace('http:', 'https:') :
                fullWebServerUri.toString();

        // Create the webview
        const panel = vscode.window.createWebviewPanel(
            'asExternalUriWebview',
            'asExternalUri Example',
            vscode.ViewColumn.One, {
            enableScripts: true
        });
        const cspSource = panel.webview.cspSource;
        panel.webview.html = `<!DOCTYPE html>
                <head>
                    <meta
                        http-equiv="Content-Security-Policy"
                        content="default-src 'none'; frame-src ${fullWebServerString} https:; img-src ${cspSource} https:; script-src ${cspSource}; style-src ${cspSource} 'unsafe-inline'"
                    />
                </head>
                <body>
                <!-- All content from the web server must be in an iframe -->
                <iframe src="${fullWebServerString}" width="600" height="600" style="background-color: white;">
            </body>
            </html>`;
    });

    context.subscriptions.push(testCommand);
}