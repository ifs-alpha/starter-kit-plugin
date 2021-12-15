"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelsComponent = void 0;
const vscode_1 = require("vscode");
const getUri_1 = require("../utilities/getUri");
/**
 * This class manages the state and behavior of AllComponents webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering AllComponents webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 */
class PanelsComponent {
    /**
     * The PanelsComponent class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    constructor(panel, extensionUri) {
        this._disposables = [];
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
    static render(extensionUri) {
        if (PanelsComponent.currentPanel) {
            // If the webview panel already exists reveal it
            PanelsComponent.currentPanel._panel.reveal(vscode_1.ViewColumn.One);
        }
        else {
            // If a webview panel does not already exist create and show a new one
            const panel = vscode_1.window.createWebviewPanel(
            // Panel view type
            "showAllComponents", 
            // Panel title
            "Webview UI Toolkit: All Components", 
            // The editor column the panel should be displayed in
            vscode_1.ViewColumn.One, 
            // Extra panel configurations
            {
                // Enable JavaScript in the webview
                enableScripts: true,
            });
            PanelsComponent.currentPanel = new PanelsComponent(panel, extensionUri);
        }
    }
    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    dispose() {
        PanelsComponent.currentPanel = undefined;
        // Dispose of the current webview panel
        this._panel.dispose();
        // Dispose of all disposables (i.e. commands) for the current webview panel
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
    _getWebviewContent(webview, extensionUri) {
        const toolkitUri = (0, getUri_1.getUri)(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js",
        ]);
        const codiconsUri = (0, getUri_1.getUri)(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "codicons",
            "dist",
            "codicon.css",
        ]);
        const mainUri = (0, getUri_1.getUri)(webview, extensionUri, ["media", "main.js"]);
        const styleUri = (0, getUri_1.getUri)(webview, extensionUri, ["media", "style.css"]);
        // Note: Since the below HTML is defined within a JavaScript template literal, all of 
        // the HTML for each component demo can be defined elsewhere and then imported/inserted
        // into the below code. This can help with code readability and organization.
        // 
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
    <section class="component-container">
      <h2>Dropdown</h2>
      <section class="component-example">
        <p>Default Dropdown</p>
        <vscode-dropdown position="below">
          <vscode-option>Option Label #1</vscode-option>
          <vscode-option>Option Label #2</vscode-option>
          <vscode-option>Option Label #3</vscode-option>
        </vscode-dropdown>
      </section>
      <section class="component-example">
        <p>With Disabled</p>
        <vscode-dropdown disabled position="below">
          <vscode-option>Option Label #1</vscode-option>
          <vscode-option>Option Label #2</vscode-option>
          <vscode-option>Option Label #3</vscode-option>
        </vscode-dropdown>
      </section>
      <section class="component-example">
        <p>With Custom Indicator Icon</p>
        <vscode-dropdown position="below">
          <span slot="indicator" class="codicon codicon-settings"></span>
          <vscode-option>Option Label #1</vscode-option>
          <vscode-option>Option Label #2</vscode-option>
          <vscode-option>Option Label #3</vscode-option>
        </vscode-dropdown>
      </section>
    </section>
  `;
    }
}
exports.PanelsComponent = PanelsComponent;
//# sourceMappingURL=PanelsComponent.js.map