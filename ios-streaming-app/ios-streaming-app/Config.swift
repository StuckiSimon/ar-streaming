//
//  Config.swift
//  ios-streaming-app
//
//  Created by Simon Stucki on 23.03.22.
//

import Foundation

struct Config {
    let signallingServerUrl: URL = URL(string: "ws://192.168.0.201:8080")!
    
    static let standard: Config = Config()
}
