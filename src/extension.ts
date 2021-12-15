// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	
	const helloCommand = commands.registerCommand("helloworld.helloWorld", () => {
		HelloWorldPanel.render(context.extensionUri);
	  });
	
	  // Add command to the extension context
	  context.subscriptions.push(helloCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
