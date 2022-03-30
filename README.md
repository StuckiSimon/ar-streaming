# AR Streaming

Project demonstrates streaming of an iOS AR view to a web browser using WebRTC.

## Structure

This project is structured as a monorepo and contains three sub-projects.
Each sub-project contains the required information about setup instructions in a separate README.

### [ios-streaming-app](./ios-streaming-app/ios-streaming-app/README.md)

iOS app which streams the data.

### [signalling-server](./signalling-server/README.md)

Signalling server which connects the streaming app to the web client.

### [web-streaming-client](./web-streaming-client/README.md)

Web client which consumes audio, video, depth map and mesh information.

## App Run Order

Make sure to run the different parts in the right order:

1. Run signalling server (optional, per default client & app connect to deployed instance)
2. Run web app and open it in a browser
3. Run iOS app (e.g. using XCode) on an iPad with LiDAR sensor
