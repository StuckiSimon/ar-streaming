//
//  ARReceiver.swift
//  ios-streaming-app
//
//  Created by Simon Stucki on 23.03.22.
//

import Foundation
import Combine
import ARKit
import WebRTC

// Receive the newest AR data from an `ARReceiver`.
protocol ARDataReceiver: AnyObject {
    func onNewDepthMap(depthMap: RTCDataBuffer)
}

// Configure and run an AR session to provide the app with depth-related AR data.
final class ARReceiver: NSObject, ARSessionDelegate {
    weak var delegate: ARDataReceiver?
    
    private var arSession = ARSession()
    private var sampleCounter = 0
    private let sampleSkipRate = 60 // how many samples to skip
    
    // Configure and start the ARSession.
    override init() {
        super.init()
        arSession.delegate = self
        start()
    }
    
    func session() -> ARSession {
        return self.arSession
    }
    
    // Configure the ARKit session.
    func start() {
        guard ARWorldTrackingConfiguration.supportsFrameSemantics([.sceneDepth, .smoothedSceneDepth]) else { return }
        // Enable both the `sceneDepth` and `smoothedSceneDepth` frame semantics.
        let config = ARWorldTrackingConfiguration()
        config.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
        arSession.run(config)
    }
    
    func pause() {
        arSession.pause()
    }
  
    // Send required data from `ARFrame` to the delegate class via the `onNewDepthMap` callback.
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        if self.sampleCounter < self.sampleSkipRate {
            self.sampleCounter += 1
            return
        }
        self.sampleCounter = 0

        if frame.sceneDepth != nil {
            let pixelBuffer = frame.sceneDepth!.depthMap
            let data = WebRTCClient.createDataFromPixelBuffer(pixelBuffer: pixelBuffer)
            let buffer = RTCDataBuffer(data: data, isBinary: true)
            delegate?.onNewDepthMap(depthMap: buffer)
        }
    }
}
