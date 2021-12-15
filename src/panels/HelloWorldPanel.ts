import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";


export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The AllComponentsPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    
    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(this.dispose, null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri) {
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      const panel = window.createWebviewPanel("helloworld", "Hello World", ViewColumn.One, {
        // Enable JavaScript in the webview
        enableScripts: true,
      });

      HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    HelloWorldPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

/**
 * Defines and returns the HTML that should be rendered within the webview panel.
 *
 * @remarks This is also the place where references to CSS and JavaScript files/packages
 * (such as the Webview UI Toolkit) are created and inserted into the webview HTML.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const codiconsUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "codicons",
      "dist",
      "codicon.css",
    ]);
    const mainUri = getUri(webview, extensionUri, ["media", "main.js"]);
    const styleUri = getUri(webview, extensionUri, ["media", "style.css"]);

    // Note: Since the below HTML is defined within a JavaScript template literal, all of 
    // the HTML for each component demo can be defined elsewhere and then imported/inserted
    // into the below code. This can help with code readability and organization.
    // 
    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
    <section class="component-container">
      <h2>Text Field</h2>
      <section class="component-example">
        <p>Default Text Field</p>
        <vscode-text-field>Text Field Label</vscode-text-field>
      </section>
      <section class="component-example">
        <p>With Disabled</p>
        <vscode-text-field disabled>Text Field Label</vscode-text-field>
      </section>
      <section class="component-example">
        <p>With Placeholder</p>
        <vscode-text-field placeholder="This is placeholder text">Text Field Label</vscode-text-field>
      </section>
      <section class="component-example">
        <p>With Readonly</p>
        <vscode-text-field readonly>Text Area Label</vscode-text-field>
      </section>
      <section class="component-example">
        <p>With Size</p>
        <vscode-text-field size="50">Text Field Label</vscode-text-field>
      </section>
      <section class="component-example">
        <p>With Maxlength</p>
        <vscode-text-field maxlength="10">Text Field Label</vscode-text-field>
      </section>
      <section class="component-example">
        <p>With Start Icon</p>
        <vscode-text-field>
          Label
          <span slot="start" class="codicon codicon-search"></span>
        </vscode-text-field>
      </section>
      <section class="component-example">
        <p>With End Icon</p>
        <vscode-text-field>
          Label
          <span slot="end" class="codicon codicon-text-size"></span>
        </vscode-text-field>
      </section>
    </section>
  `;
  }

}