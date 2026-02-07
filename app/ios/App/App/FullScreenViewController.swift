import UIKit
import Capacitor

class FullScreenViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // 禁止 WebView 滚动
        webView?.scrollView.isScrollEnabled = false
        webView?.scrollView.bounces = false
        webView?.scrollView.contentInsetAdjustmentBehavior = .never

        // 监听键盘弹出，强制重置滚动位置
        NotificationCenter.default.addObserver(forName: UIResponder.keyboardWillShowNotification, object: nil, queue: .main) { [weak self] _ in
            self?.webView?.scrollView.setContentOffset(.zero, animated: false)
        }
        NotificationCenter.default.addObserver(forName: UIResponder.keyboardDidShowNotification, object: nil, queue: .main) { [weak self] _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                self?.webView?.scrollView.setContentOffset(.zero, animated: false)
            }
        }
    }

    // 每次布局更新时，强制 WebView 铺满整个 view（忽略安全区域）
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        webView?.frame = view.bounds
    }
}
