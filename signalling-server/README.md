# Signalling Server

Node.js based signalling server. The signalling server broadcasts to all clients.

## Dev

`npm run start`

## Deploy

The signalling server is deployed on heroku (`wss://vt1-signalling-server.herokuapp.com`).

To setup heroku once locally, the remote has to be configured using:

`heroku git:remote -a vt1-signalling-server`

> Make sure to have access to the corresponding application, or create a new one.

Afterwards, a deployment can be started using:

`npm run deploy`

> This script pushes the current git state to Heroku