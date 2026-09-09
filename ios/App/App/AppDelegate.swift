import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

/* ============================================================================
   PrintBridge — makes the report's "Print / PDF" button work.

   window.print() does nothing inside a WKWebView, so without this the button is
   silently inert in the shipped app, and that one-page summary is the reason a
   GP was interested in the app at all. printReport() in index.html posts to a
   handler named "print" when one exists and falls back to window.print() in a
   browser, so this is the whole native half.

   It lives in AppDelegate.swift on purpose. A new .swift file would have to be
   added to the Xcode target, and this repository builds on a machine with no
   Xcode on it — editing project.pbxproj by hand to add a build phase entry is a
   way to break a build that currently works. This file is already in the target.

   Deliberately a plain WKScriptMessageHandler and not a Capacitor plugin: `cap
   sync` rewrites packageClassList in the generated capacitor.config.json from
   whatever is in node_modules, erasing an app-local class on every sync. An
   unregistered plugin compiles, ships, and is unreachable from JavaScript. A
   message handler has no registry to fall out of.
   ========================================================================== */
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
