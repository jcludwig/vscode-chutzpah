'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import open = require('open');
import path = require('path');
import fs = require('fs');
import * as shelljs from 'shelljs';

function findChutzpahExecutable(startPath: string): string {
    let parts = startPath.split(path.sep);
    let foundChutzpah = false;
    let chutzpahPath: string;
    while (parts.length > 0 && !foundChutzpah) {
        parts.splice(parts.length - 1, 1);

        chutzpahPath = path.resolve(...parts.concat(['tools', 'chutzpah', '4.2.4', 'chutzpah.console.exe']));
        if (fs.existsSync(chutzpahPath))
            foundChutzpah = true;
    }

    if (foundChutzpah)
        return chutzpahPath;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "chutzpah-runner" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.runChutzpah', (uri: vscode.Uri) => {
        // The code you place here will be executed every time your command is executed

        let normalized = path.normalize(uri.fsPath);
        let parts = normalized.split(path.sep);

        let foundChutzpah = false;
        let chutzpahPath: string;
        let relativeTestPath: string[] = [];
        while (parts.length > 0 && !foundChutzpah) {
            relativeTestPath.unshift(parts[parts.length - 1]);
            parts.splice(parts.length - 1, 1);

            chutzpahPath = path.resolve(...parts.concat('chutzpah.json'));
            if (fs.existsSync(chutzpahPath))
                foundChutzpah = true;
        }

        let chutzpahRunner = findChutzpahExecutable(chutzpahPath);

        if (foundChutzpah && chutzpahRunner) {
            let chutzpahOutputChannel = vscode.window.createOutputChannel('ChuzpahOutput');
            chutzpahOutputChannel.show(true);

            let command = chutzpahRunner + ' ' + relativeTestPath.join(path.sep) + ' /trace /openInBrowser';
            chutzpahOutputChannel.appendLine(command);

            let process = shelljs.exec(command, { async: true, cwd: path.resolve(...parts) }, () => { /*fs.unlink(tmpPath);*/ });
            process.stdout.on('data', (data) => {
                chutzpahOutputChannel.append(<string>data);
            });

            process.on('exit', (code) => {
                vscode.window.showInformationMessage('Chutzpah exited with code: ' + code);        
            })
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}