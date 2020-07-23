# real-time-tic-tac-toe

A Node application that uses sockets to enable a real-time game between two users on different devices.

Any socket client can connect to this server.

## How it works

### Overview

- A player can register using a mobile number.
- A player can view online opponents.
- A player can start a game with an online opponent.

### Technical

The client can send events and listen to responses.

The server's socket has 4 events that it can listen to:

- checkUserDetail
- getOpponents
- selectOpponents
- disconnect

Subsequently, it has 8 more responses it can emit:

- getOpponentsResponse
- newOpponentAdded (broadcast)
- opponentLeft (to gameId socket)
- opponentDisconnected
- excludePlayers
- gameStarted (to gameId socket)
- gameInterval (to gameId socket)
- nextGameData (to gameId socket)
