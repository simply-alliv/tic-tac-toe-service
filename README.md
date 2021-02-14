# Tic-Tac-Toe Service

Heavily inspired by Parth Patel's [repository](https://github.com/myvsparth/react-js-tic-tac-toe). Modified to work with express and ES6 syntax.
 
A [Node.js](https://nodejs.org/)/[Express](https://expressjs.com/) service that uses [socket.io](https://socket.io/)'s API to enable a real-time game between two users on different devices.

Any socket.io client can connect to this server. Enabling an optimal separation of concerns, an improvement in maintainability, and the freedom for frontend developers to focus on the UI and UX of the client.

## How it works

### Overview

- A player can register using a mobile number.
- A player can view online opponents.
- A player can start a game with an online opponent.
- After a game, current players can select to have a rematch (10 second limit).

### Technical

The service can emit events and listen to responses through socket.io.

The service's socket has 5 events that it listens to:

- checkUserDetail
- getOpponents
- selectOpponent
- selectCell
- disconnect

Subsequently, it has 11 more responses it can emit:

- connected
- checkUserDetailResponse
- getOpponentsResponse
- opponentDisconnected
- excludePlayers
- newOpponentAdded (broadcast)
- gameStarted (to gameId socket)
- selectCellResponse (to gameId socket)
- gameInterval (to gameId socket)
- nextGameData (to gameId socket)
- opponentLeft (to gameId socket)
