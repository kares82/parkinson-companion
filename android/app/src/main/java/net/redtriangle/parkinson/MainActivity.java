package net.redtriangle.parkinson;

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
     * Android's WebView, like iOS's, does nothing for window.print(). The web
     * side (printReport() in index.html) prefers a native handler when one is
     * present, so this exposes one under the same name the iOS bridge uses.
     */
    public static class PrintBridge {
        private final MainActivity activity;

        PrintBridge(MainActivity activity) { this.activity = activity; }

        @JavascriptInterface
        public void postMessage(String json) {
            activity.runOnUiThread(() -> activity.printCurrentPage());
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // The interface survives navigation; an injected JS shim would not,
        // so the web side asks for AndroidPrintBridge by name instead.
        getBridge().getWebView()
            .addJavascriptInterface(new PrintBridge(this), "AndroidPrintBridge");
    }

    private void printCurrentPage() {
        WebView webView = getBridge().getWebView();
        PrintManager printManager = (PrintManager) getSystemService(PRINT_SERVICE);
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
