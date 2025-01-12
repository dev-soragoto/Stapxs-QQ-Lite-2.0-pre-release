//
//  UIViewController.swift
//  App
//
//  Created by 林小槐 on 2024/12/25.
//

import UIKit

extension UIViewController {
    public class func initializeMethod(){
        if self != UIViewController.self{
            return
        }
        DispatchQueue.once(token: "ChangeIcon") {
            let orignal = class_getInstanceMethod(self, #selector(UIViewController.present(_:animated:completion:)))
            let swizzling = class_getInstanceMethod(self, #selector(UIViewController.ssl_present(_:animated:completion:)))
            if let old = orignal, let new = swizzling{
                method_exchangeImplementations(old, new)
            }
        }
    }
    @objc private func ssl_present(_ viewControllerToPresent: UIViewController, animated flag: Bool, completion: (() -> Void)? = nil) {
        if viewControllerToPresent is UIAlertController{
            let vc = viewControllerToPresent as! UIAlertController
            if vc.title == nil && vc.message == nil{
                return
            }
        }
        self.ssl_present(viewControllerToPresent, animated: flag, completion: completion)
    }
}
extension DispatchQueue{
    private static var _onceTracker = [String]()
    public class func once(token: String, block:()->()){
        objc_sync_enter(self)
        defer{
            objc_sync_exit(self)
        }
        if _onceTracker.contains(token){
            return
        }
        _onceTracker.append(token)
        block()
    }
}
