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
    func onNewDepthMap(depthMap: CVPixelBuffer)
    func onNewMesh(mesh: String)
}

// Configure and run an AR session to provide the app with depth-related AR data.
final class ARReceiver: NSObject, ARSessionDelegate {
    weak var delegate: ARDataReceiver?
    
    private var arSession = ARSession()
    private var sampleCounter = 0
    private let sampleSkipRate = 180 // how many samples to skip
    
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
        config.sceneReconstruction = .meshWithClassification
        arSession.run(config)
    }
    
    func pause() {
        arSession.pause()
    }
  
    // Send required data from `ARFrame` to the delegate class via the `onNewDepthMap` callback.
    func session(_: ARSession, didUpdate frame: ARFrame) {
        if self.sampleCounter < self.sampleSkipRate {
            self.sampleCounter += 1
            return
        }
        self.sampleCounter = 0
        
        if (frame.anchors.count > 0) {
            let obj = getMeshAsObj(anchors: frame.anchors)
            delegate?.onNewMesh(mesh: obj)
        }

        if frame.sceneDepth != nil {
            let pixelBuffer = frame.sceneDepth!.depthMap
            delegate?.onNewDepthMap(depthMap: pixelBuffer)
        }
    }
    
    // Convert mesh data to .obj as string
    func getMeshAsObj(anchors: [ARAnchor]) -> String {
        var obj = ""
        var anchorVertexCounter = 1
        for arAnchor in anchors {
            let anchor = arAnchor as! ARMeshAnchor
            
            obj += "g group" + String(anchorVertexCounter) + "\n"
            
            for vertexIndex in 0...anchor.geometry.vertices.count {
                let vertex = anchor.geometry.vertex(at: UInt32(vertexIndex))
                obj += "v" + " "
                obj += String(vertex[0]) + " "
                obj += String(vertex[1]) + " "
                obj += String(vertex[2]) + "\n"
            }
            for faceIndex in 0...anchor.geometry.faces.count {
                let vertexIndices = anchor.geometry.vertexIndicesOf(faceWithIndex: faceIndex)
                obj += "f" + " "
                obj += String(anchorVertexCounter + vertexIndices[0]) + " "
                obj += String(anchorVertexCounter + vertexIndices[1]) + " "
                obj += String(anchorVertexCounter + vertexIndices[2]) + "\n"
            }
            anchorVertexCounter += anchor.geometry.vertices.count + 1
        }
        return obj
    }
}
