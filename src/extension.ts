'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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

interface RunChutzpahOptions {
    testFile: vscode.Uri;
    openInBrowser?: boolean;
}

function runChutzpah(options: RunChutzpahOptions): void {
    let normalized = path.normalize(options.testFile.fsPath);
    let searchPath = normalized.split(path.sep);

    let foundChutzpahConfig = false;
    let chutzpahConfigPath: string;
    let relativeTestFilePath: string[] = [];
    while (searchPath.length > 0 && !foundChutzpahConfig) {
        // Build the relative test file path and chutzpah config search path at the same time
        relativeTestFilePath.unshift(searchPath[searchPath.length - 1]);
        searchPath.splice(searchPath.length - 1, 1);

        chutzpahConfigPath = path.resolve(...searchPath.concat('chutzpah.json'));
        if (fs.existsSync(chutzpahConfigPath))
            foundChutzpahConfig = true;
    }

    let chutzpahRunner = findChutzpahExecutable(chutzpahConfigPath);

    if (foundChutzpahConfig && chutzpahRunner) {
        let chutzpahOutputChannel = vscode.window.createOutputChannel('ChuzpahOutput');
        chutzpahOutputChannel.show(true);

        let commandOptions = [chutzpahRunner, relativeTestFilePath.join(path.sep), '/trace'];
        if (options.openInBrowser)
            commandOptions.push('/openInBrowser');

        let command = commandOptions.join(' ');
        chutzpahOutputChannel.appendLine('Running ' + command);

        let process = shelljs.exec(command, { async: true, cwd: path.resolve(...searchPath) }, () => { });
        process.stdout.on('data', (data) => {
            chutzpahOutputChannel.append(<string>data);
        });

        process.on('exit', (code) => {
            if (code === 0)
                vscode.window.showInformationMessage('Chutzpah exited successfully');
            else
                vscode.window.showWarningMessage('Chutzpah exited with code ' + code);
        });
    }
}

export function activate(context: vscode.ExtensionContext) {
    let disposables = [];
    disposables.push(vscode.commands.registerCommand('extension.runChutzpah', (uri: vscode.Uri) => {
        runChutzpah({ testFile: uri, openInBrowser: false });
    }));
    disposables.push(vscode.commands.registerCommand('extension.runChutzpahInBrowser', (uri: vscode.Uri) => {
        runChutzpah({ testFile: uri, openInBrowser: true });
    }));

    context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {
}