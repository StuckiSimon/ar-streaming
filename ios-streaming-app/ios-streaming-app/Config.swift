//
//  Config.swift
//  ios-streaming-app
//
//  Created by Simon Stucki on 23.03.22.
//

import Foundation

struct Config {
    let signallingServerUrl: URL = URL(string: "ws://vt1-signalling-server.herokuapp.com")!
    
    static let standard: Config = Config()
}
