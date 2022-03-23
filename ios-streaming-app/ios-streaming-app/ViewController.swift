//
//  ViewController.swift
//  ios-streaming-app
//
//  Created by Simon Stucki on 23.03.22.
//

import UIKit
import RealityKit
import WebRTC

class ViewController: UIViewController {
    
    @IBOutlet var arView: ARView!
    
    
    private let signalClient: SignallingClient = SignallingClient()
    private let webRTCClient: WebRTCClient = WebRTCClient(iceServers: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302"])
    
    private var arReceiver: ARReceiver!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.signalClient.delegate = self
        self.webRTCClient.delegate = self
        
        let boxAnchor = try! Experience.loadBox()
        arView.scene.anchors.append(boxAnchor)
        
        self.signalClient.connect()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        self.arReceiver = ARReceiver()
        self.arReceiver.delegate = self
    }
}

extension ViewController: SignallingClientDelegate {
    func signalClientDidConnect(_ signalClient: SignallingClient) {
        print("connected to signalling client, attempt sdp offer")
        self.webRTCClient.offer { (sdp) in
            self.signalClient.send(sdp: sdp)
        }
    }
    
    func signalClientDidDisconnect(_ signalClient: SignallingClient) {
        print("signalling client disconnected")
    }
    
    func signalClient(_ signalClient: SignallingClient, didReceiveRemoteSdp sdp: RTCSessionDescription) {
        print("Received remote sdp")
        self.webRTCClient.set(remoteSdp: sdp) { (error) in
            print("set remote sdp")
        }
    }
    
    func signalClient(_ signalClient: SignallingClient, didReceiveCandidate candidate: RTCIceCandidate) {
        self.webRTCClient.set(remoteCandidate: candidate) { error in
            print("Received remote candidate")
        }
    }
}


extension ViewController: WebRTCClientDelegate {
    
    func webRTCClient(_ client: WebRTCClient, didDiscoverLocalCandidate candidate: RTCIceCandidate) {
        print("discovered local candidate")
        self.signalClient.send(candidate: candidate)
    }
    
    func webRTCClient(_ client: WebRTCClient, didChangeConnectionState state: RTCIceConnectionState) {
        switch state {
        case .connected, .completed:
            print("connected rtc")
            self.webRTCClient.startCaptureLocalVideo()
        case .disconnected:
            print("disconnected rtc")
        case .failed:
            print("failed rtc")
        case .closed:
            print("closed rtc")
        case .new, .checking, .count:
            print("pending rtc")
        @unknown default:
            print("unknown rtc state")
        }
    }
    
    func webRTCClient(_ client: WebRTCClient, didReceiveData data: Data) {
        DispatchQueue.main.async {
            let message = String(data: data, encoding: .utf8) ?? "(Binary: \(data.count) bytes)"
            let alert = UIAlertController(title: "Message from WebRTC", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .cancel, handler: nil))
            self.present(alert, animated: true, completion: nil)
        }
    }
}

extension ViewController: ARDataReceiver {
    func onNewDepthMap(depthMap: RTCDataBuffer) {
        self.webRTCClient.sendDepthMapData(depthMap: depthMap)
    }
}
