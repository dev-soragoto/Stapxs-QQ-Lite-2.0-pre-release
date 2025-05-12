import Foundation

class HTTPUtil: NSObject, URLSessionDelegate, URLSessionDataDelegate {

    var redirectCount = 0
    let maxRedirectDepth = 100

    func getFinalRedirectedURL(for url: URL, completion: @escaping (URL?) -> Void) {
        let sessionConfig = URLSessionConfiguration.default
        let session = URLSession(configuration: sessionConfig, delegate: self, delegateQueue: nil)

        let task = session.dataTask(with: url) { data, response, error in
            if let error = error {
                print("Request failed: \(error.localizedDescription)")
                completion(nil)
                return
            }

            if let response = response as? HTTPURLResponse {
                if (300...399).contains(response.statusCode) {
                    if let newURL = response.allHeaderFields["Location"] as? String, self.redirectCount < self.maxRedirectDepth {
                        self.redirectCount += 1
                        if let newURL = URL(string: newURL) {
                            self.getFinalRedirectedURL(for: newURL, completion: completion)
                            return
                        }
                    } else {
                        completion(nil)
                        return
                    }
                } else {
                    completion(response.url)
                    return
                }
            }
        }

        task.resume()
    }

    func fetchContent(from url: URL, expectedMimeType: String, completion: @escaping (String?) -> Void) {
        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            guard error == nil else {
                print("Request failed: \(error!.localizedDescription)")
                completion(nil)
                return
            }

            guard let httpResponse = response as? HTTPURLResponse,
                let mimeType = httpResponse.mimeType,
                mimeType == expectedMimeType else {
                print("MIME type mismatch or missing (expected \(expectedMimeType))")
                completion(nil)
                return
            }

            guard let data = data,
                let contentString = String(data: data, encoding: .utf8) else {
                print("Failed to decode content as UTF-8 string")
                completion(nil)
                return
            }

            completion(contentString)
        }

        task.resume()
    }
}
