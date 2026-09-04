//  Print bridge for the WKWebView wrapper.
//
//  window.print() does nothing inside a WKWebView, so the report's "Print / PDF"
//  button — the one-page summary a GP puts in the patient's file — would silently
//  do nothing in the App Store build. The web app posts to a "print" message
//  handler when one exists (see printReport() in index.html) and falls back to
//  window.print() in a browser, so this file is all that is needed on the native
//  side.
//
//  Install: add to the Capacitor iOS target, then in AppDelegate (or the
//  ViewController that owns the bridge) call `PrintBridge.attach(to: webView)`
//  once the web view exists.

import UIKit
import WebKit

final class PrintBridge: NSObject, WKScriptMessageHandler {

    private weak var webView: WKWebView?
    private static var retained: PrintBridge?

    static func attach(to webView: WKWebView) {
        let bridge = PrintBridge()
        bridge.webView = webView
        webView.configuration.userContentController.add(bridge, name: "print")
        retained = bridge          // the content controller holds only a weak ref
    }

    func userContentController(_ controller: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "print", let webView = webView else { return }

        let title = ((message.body as? [String: Any])?["title"] as? String) ?? "Parkinson Companion"

        DispatchQueue.main.async {
            let info = UIPrintInfo.printInfo()
            info.outputType = .general
            info.jobName = title

            let controller = UIPrintInteractionController.shared
            controller.printInfo = info
            // viewPrintFormatter honours the page's @media print stylesheet, so the
            // printed sheet matches what the browser build produces.
            controller.printFormatter = webView.viewPrintFormatter()

            if let popover = controller.printInteractionController(for: webView) {
                _ = popover
            }
            controller.present(animated: true) { _, _, error in
                if let error = error { NSLog("print failed: \(error.localizedDescription)") }
            }
        }
    }
}

private extension UIPrintInteractionController {
    /// iPad presents the print sheet in a popover and needs an anchor.
    func printInteractionController(for view: UIView) -> UIPrintInteractionController? {
        return UIDevice.current.userInterfaceIdiom == .pad ? self : nil
    }
}
