# AR Streaming

Project demonstrates streaming of an iOS AR view to a web browser using WebRTC.

## Structure

The project consists of multiple sub-projects.

### ios-streaming-app

iOS app which streams the data.

### signalling-server

Signalling server which connects the streaming app to the web client.

### web-streaming-client

Web client which consumes audio, video and depth map.

## App Run Order

Make sure to run the different parts in the right order:

1. Run signalling server
2. Run web app
3. Run iOS app (e.g. using XCode)