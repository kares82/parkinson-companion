import UIKit
import WebKit
import Capacitor

/// Makes the report's "Print / PDF" button work.
///
/// `window.print()` does nothing inside a WKWebView, so without this the button
/// is silently inert in the shipped app — and that one-page summary is the
/// reason a GP was interested in the app at all. `printReport()` in index.html
/// posts to a message handler named "print" when one exists and falls back to
/// `window.print()` in a browser, so this is the whole native half.
///
/// Deliberately NOT a Capacitor plugin: `cap sync` rewrites `packageClassList`
/// in the generated capacitor.config.json from what it finds in node_modules,
/// which silently drops an app-local plugin from the list on every sync. An
/// unregistered plugin compiles, ships, and is unreachable from JavaScript.
/// A plain message handler has no registry to fall out of.
final class PrintBridge: NSObject, WKScriptMessageHandler {

    private weak var webView: WKWebView?
    private static var retained: PrintBridge?

    static func attach(to webView: WKWebView) {
        let bridge = PrintBridge()
        bridge.webView = webView
        // The content controller holds handlers weakly; without a strong
        // reference here the bridge deallocates and messages vanish.
        retained = bridge
        webView.configuration.userContentController.add(bridge, name: "print")
    }

    func userContentController(_ controller: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "print", let webView = self.webView else { return }
        let title = ((message.body as? [String: Any])?["title"] as? String)
            ?? "Parkinson Companion"

        DispatchQueue.main.async {
            let info = UIPrintInfo.printInfo()
            info.outputType = .general
            info.jobName = title

            let controller = UIPrintInteractionController.shared
            controller.printInfo = info
            // viewPrintFormatter honours the page's @media print stylesheet, so
            // the sheet matches what the browser build produces.
            controller.printFormatter = webView.viewPrintFormatter()
            controller.present(animated: true) { _, _, error in
                if let error = error {
                    NSLog("PrintBridge: %@", error.localizedDescription)
                }
            }
        }
    }
}

extension CAPBridgeViewController {
    /// Called from SceneDelegate once the bridge's web view exists.
    func attachPrintBridge() {
        if let wv = self.webView { PrintBridge.attach(to: wv) }
    }
}
