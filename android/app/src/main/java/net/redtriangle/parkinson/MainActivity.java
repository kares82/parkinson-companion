package net.redtriangle.parkinson;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Makes the report's "Print / PDF" button work.
     *
     * Android's WebView, like iOS's, does nothing for window.print(), so
     * without this the button is silently dead — and that one-page summary is
     * the reason a GP was interested in the app at all. printReport() in
     * index.html asks for this interface by name and falls back to
     * window.print() in a real browser.
     */
    public static class PrintBridge {
        private final MainActivity activity;

        PrintBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void postMessage(String json) {
            activity.runOnUiThread(activity::printCurrentPage);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // super.onCreate builds the bridge, so the web view exists by now —
        // but guarded anyway: a null here would crash on launch, and a print
        // button that does nothing is a far smaller failure than an app that
        // will not start.
        WebView webView = webView();
        if (webView != null) {
            webView.addJavascriptInterface(new PrintBridge(this), "AndroidPrintBridge");
        }
    }

    private WebView webView() {
        return (getBridge() == null) ? null : getBridge().getWebView();
    }

    private void printCurrentPage() {
        WebView webView = webView();
        if (webView == null) return;

        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        if (printManager == null) return;

        String jobName = getString(R.string.app_name) + " report";
        // createPrintDocumentAdapter honours the page's @media print stylesheet,
        // so the sheet matches what the browser build produces.
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
        printManager.print(jobName, adapter,
                new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .build());
    }
}
