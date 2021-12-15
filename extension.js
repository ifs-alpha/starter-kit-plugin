// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
//import { HelloWorldPanel } from "./src/panels/HelloWorldPanel";




// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const generate = require('./generate').generate;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let root = context.asAbsolutePath("");
  //  fs.readFile(fullFilePath, (err, data) => { ... });
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "starter-kit-plugin" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	
	let disposable = vscode.commands.registerCommand('starter-kit-plugin.run-starter-config', function () {
		// The code you place here will be executed every time your command is executed
		generate(root);
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Starter Kit Plugin!');
		//HelloWorldPanel.render(context.extensionUri);
		});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
