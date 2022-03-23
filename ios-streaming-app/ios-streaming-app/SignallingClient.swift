//
//  SignallingClient.swift
//  ios-streaming-app
//
//  Created by Simon Stucki on 23.03.22.
//

import Foundation
import WebRTC

protocol SignallingClientDelegate: AnyObject {
    func signalClientDidConnect(_ signalClient: SignallingClient)
    func signalClientDidDisconnect(_ signalClient: SignallingClient)
    func signalClient(_ signalClient: SignallingClient, didReceiveRemoteSdp sdp: RTCSessionDescription)
    func signalClient(_ signalClient: SignallingClient, didReceiveCandidate candidate: RTCIceCandidate)
}

class SignallingClient {
    weak var delegate: SignallingClientDelegate?
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    // TODO: extract magic variable
    private lazy var webSocket = WebSocketProvider(url: URL(string: "ws://192.168.0.201:8080")!)
    
    func connect() {
        self.webSocket.delegate = self
        self.webSocket.connect()
    }
    
    func send(sdp rtcSdp: RTCSessionDescription) {
        let message = Message.sdp(SessionDescription(from: rtcSdp))
        do {
            let dataMessage = try self.encoder.encode(message)
            
            self.webSocket.send(data: dataMessage)
        }
        catch {
            debugPrint("Warning: Could not encode sdp: \(error)")
        }
    }
    
    func send(candidate rtcIceCandidate: RTCIceCandidate) {
        let message = Message.candidate(IceCandidate(from: rtcIceCandidate))
        do {
            let dataMessage = try self.encoder.encode(message)
            self.webSocket.send(data: dataMessage)
        }
        catch {
            debugPrint("Warning: Could not encode candidate: \(error)")
        }
    }
}

extension SignallingClient: WebSocketProviderDelegate {
    func webSocketDidConnect(_ webSocket: WebSocketProvider) {
        self.delegate?.signalClientDidConnect(self)
    }
    
    func webSocketDidDisconnect(_ webSocket: WebSocketProvider) {
        self.delegate?.signalClientDidDisconnect(self)
        
        // try to reconnect every two seconds
        DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
            debugPrint("Trying to reconnect to signaling server...")
            self.webSocket.connect()
        }
    }
    
    func webSocket(_ webSocket: WebSocketProvider, didReceiveData data: Data) {
        let message: Message
        do {
            message = try self.decoder.decode(Message.self, from: data)
        }
        catch {
            debugPrint("Warning: Could not decode incoming message: \(error)")
            return
        }
        
        switch message {
        case .candidate(let iceCandidate):
            self.delegate?.signalClient(self, didReceiveCandidate: iceCandidate.rtcIceCandidate)
        case .sdp(let sessionDescription):
            self.delegate?.signalClient(self, didReceiveRemoteSdp: sessionDescription.rtcSessionDescription)
        }

    }
}
