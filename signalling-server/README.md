# Signalling Server

Node.js based signalling server.

## Dev

`npm run start`

## Deploy

The signalling server is deployed on heroku.

To setup heroku once locally, the remote has to be configured using:

`heroku git:remote -a vt1-signalling-server`

> Make sure to have access to the corresponding application, or create a new one.

Afterwards, a deployment can be started using:

`npm run deploy`

> This script pushes the current git state to Heroku