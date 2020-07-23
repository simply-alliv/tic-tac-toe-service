const socketIO = require("socket.io");
const winCombinationMatrix = require("./utils/winCombinationMatrix");

class Games {
  io;

  players = {}; // It stores all the players data who have register using mobile number.
  sockets = {}; // It stores all the connected clients.
  games = {}; // It stores the ongoing games.

  gameBetweenSeconds = 10; // Time between next game
  gameBetweenInterval = null;

  constructor(server) {
    this.io = socketIO(server);
    this.initializeSocketConnection();
  }

  // When any request comes it will trigger and bind all the susequence events that will
  // triggered as per app logic.
  initializeSocketConnection() {
    this.io.on("connection", (client) => {
      console.log("connected : " + client.id);

      // Notify request cllient that it is not connected with server
      client.emit("connected", { id: client.id });

      client.on("checkUserDetail", (data) =>
        this.checkUserDetail(data, client)
      );

      client.on("getOpponents", () => this.getOpponents(client));

      client.on("selectOpponent", (data) => this.selectOpponent(data, client));

      client.on("selectCell", (data) => this.selectCell(data));

      client.on("disconnect", (data) => this.disconnect(client));
    });
  }

  // Handles user registration process.
  checkUserDetail(data, client) {
    var flag = false;
    for (var id in this.sockets) {
      if (this.sockets[id].mobile_number === data.mobileNumber) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      this.sockets[client.id] = {
        mobile_number: data.mobileNumber,
        is_playing: false,
        game_id: null,
      };

      var flag1 = false;
      for (var id in this.players) {
        if (id === data.mobileNumber) {
          flag1 = true;
          break;
        }
      }
      if (!flag1) {
        this.players[data.mobileNumber] = {
          played: 0,
          won: 0,
          draw: 0,
        };
      }
    }
    client.emit("checkUserDetailResponse", !flag);
  }

  // Returns all the players who are online and avalable to play the game.
  getOpponents(client) {
    var response = [];
    for (var id in this.sockets) {
      if (id !== client.id && !this.sockets[id].is_playing) {
        response.push({
          id: id,
          mobile_number: this.sockets[id].mobile_number,
          played: this.players[this.sockets[id].mobile_number].played,
          won: this.players[this.sockets[id].mobile_number].won,
          draw: this.players[this.sockets[id].mobile_number].draw,
        });
      }
    }
    client.emit("getOpponentsResponse", response);
    client.broadcast.emit("newOpponentAdded", {
      id: client.id,
      mobile_number: this.sockets[client.id].mobile_number,
      played: this.players[this.sockets[client.id].mobile_number].played,
      won: this.players[this.sockets[client.id].mobile_number].won,
      draw: this.players[this.sockets[client.id].mobile_number].draw,
    });
  }

  // When Client select any opponent to play game then it will generate new game
  // and return playboard to play the game.
  //
  // New game starts here.
  selectOpponent(data, client) {
    var response = {
      status: false,
      message: "Opponent is playing with someone else.",
    };
    if (!this.sockets[data.id].is_playing) {
      var gameId = this.uuidv4();
      this.sockets[data.id].is_playing = true;
      this.sockets[client.id].is_playing = true;
      this.sockets[data.id].game_id = gameId;
      this.sockets[client.id].game_id = gameId;
      this.players[this.sockets[data.id].mobile_number].played =
        this.players[this.sockets[data.id].mobile_number].played + 1;
      this.players[this.sockets[client.id].mobile_number].played =
        this.players[this.sockets[client.id].mobile_number].played + 1;

      this.games[gameId] = {
        player1: client.id,
        player2: data.id,
        whose_turn: client.id,
        playboard: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
        game_status: "ongoing", // "ongoing","won","draw"
        game_winner: null, // winner_id if status won
        winning_combination: [],
      };
      this.games[gameId][client.id] = {
        mobile_number: this.sockets[client.id].mobile_number,
        sign: "x",
        played: this.players[this.sockets[client.id].mobile_number].played,
        won: this.players[this.sockets[client.id].mobile_number].won,
        draw: this.players[this.sockets[client.id].mobile_number].draw,
      };
      this.games[gameId][data.id] = {
        mobile_number: this.sockets[data.id].mobile_number,
        sign: "o",
        played: this.players[this.sockets[data.id].mobile_number].played,
        won: this.players[this.sockets[data.id].mobile_number].won,
        draw: this.players[this.sockets[data.id].mobile_number].draw,
      };
      this.io.sockets.connected[client.id].join(gameId);
      this.io.sockets.connected[data.id].join(gameId);
      this.io.emit("excludePlayers", [client.id, data.id]);
      this.io.to(gameId).emit("gameStarted", {
        status: true,
        game_id: gameId,
        game_data: this.games[gameId],
      });
    }
  }

  // When Player select any cell then it will check all the necessory logic of Tic Tac Toe Game.
  selectCell(data) {
    this.games[data.gameId].playboard[data.i][data.j] = this.games[data.gameId][
      this.games[data.gameId].whose_turn
    ].sign;

    var isDraw = true;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.games[data.gameId].playboard[i][j] == "") {
          isDraw = false;
          break;
        }
      }
    }
    if (isDraw) this.games[data.gameId].game_status = "draw";

    for (let i = 0; i < winCombinationMatrix.length; i++) {
      var tempComb =
        this.games[data.gameId].playboard[winCombinationMatrix[i][0][0]][
          winCombinationMatrix[i][0][1]
        ] +
        this.games[data.gameId].playboard[winCombinationMatrix[i][1][0]][
          winCombinationMatrix[i][1][1]
        ] +
        this.games[data.gameId].playboard[winCombinationMatrix[i][2][0]][
          winCombinationMatrix[i][2][1]
        ];
      if (tempComb === "xxx" || tempComb === "ooo") {
        this.games[data.gameId].game_winner = this.games[
          data.gameId
        ].whose_turn;
        this.games[data.gameId].game_status = "won";
        this.games[data.gameId].winning_combination = [
          [winCombinationMatrix[i][0][0], winCombinationMatrix[i][0][1]],
          [winCombinationMatrix[i][1][0], winCombinationMatrix[i][1][1]],
          [winCombinationMatrix[i][2][0], winCombinationMatrix[i][2][1]],
        ];
        this.players[
          this.games[data.gameId][this.games[data.gameId].game_winner]
            .mobile_number
        ].won++;
      }
    }
    if (this.games[data.gameId].game_status == "draw") {
      this.players[
        this.games[data.gameId][this.games[data.gameId].player1].mobile_number
      ].draw++;
      this.players[
        this.games[data.gameId][this.games[data.gameId].player2].mobile_number
      ].draw++;
    }
    this.games[data.gameId].whose_turn =
      this.games[data.gameId].whose_turn == this.games[data.gameId].player1
        ? this.games[data.gameId].player2
        : this.games[data.gameId].player1;
    this.io.to(data.gameId).emit("selectCellResponse", this.games[data.gameId]);

    if (
      this.games[data.gameId].game_status == "draw" ||
      this.games[data.gameId].game_status == "won"
    ) {
      this.gameBetweenSeconds = 10;
      this.gameBetweenInterval = setInterval(() => {
        this.gameBetweenSeconds--;
        this.io.to(data.gameId).emit("gameInterval", this.gameBetweenSeconds);
        if (this.gameBetweenSeconds == 0) {
          clearInterval(this.gameBetweenInterval);

          var gameId = this.uuidv4();
          this.sockets[this.games[data.gameId].player1].game_id = gameId;
          this.sockets[this.games[data.gameId].player2].game_id = gameId;
          this.players[
            this.sockets[this.games[data.gameId].player1].mobile_number
          ].played =
            this.players[
              this.sockets[this.games[data.gameId].player1].mobile_number
            ].played + 1;
          this.players[
            this.sockets[this.games[data.gameId].player2].mobile_number
          ].played =
            this.players[
              this.sockets[this.games[data.gameId].player2].mobile_number
            ].played + 1;

          this.games[gameId] = {
            player1: this.games[data.gameId].player1,
            player2: this.games[data.gameId].player2,
            whose_turn:
              this.games[data.gameId].game_status == "won"
                ? this.games[data.gameId].game_winner
                : this.games[data.gameId].whose_turn,
            playboard: [
              ["", "", ""],
              ["", "", ""],
              ["", "", ""],
            ],
            game_status: "ongoing", // "ongoing","won","draw"
            game_winner: null, // winner_id if status won
            winning_combination: [],
          };
          this.games[gameId][this.games[data.gameId].player1] = {
            mobile_number: this.sockets[this.games[data.gameId].player1]
              .mobile_number,
            sign: "x",
            played: this.players[
              this.sockets[this.games[data.gameId].player1].mobile_number
            ].played,
            won: this.players[
              this.sockets[this.games[data.gameId].player1].mobile_number
            ].won,
            draw: this.players[
              this.sockets[this.games[data.gameId].player1].mobile_number
            ].draw,
          };
          this.games[gameId][this.games[data.gameId].player2] = {
            mobile_number: this.sockets[this.games[data.gameId].player2]
              .mobile_number,
            sign: "o",
            played: this.players[
              this.sockets[this.games[data.gameId].player2].mobile_number
            ].played,
            won: this.players[
              this.sockets[this.games[data.gameId].player2].mobile_number
            ].won,
            draw: this.players[
              this.sockets[this.games[data.gameId].player2].mobile_number
            ].draw,
          };
          this.io.sockets.connected[this.games[data.gameId].player1].join(
            gameId
          );
          this.io.sockets.connected[this.games[data.gameId].player2].join(
            gameId
          );

          this.io.to(gameId).emit("nextGameData", {
            status: true,
            game_id: gameId,
            game_data: this.games[gameId],
          });

          this.io.sockets.connected[this.games[data.gameId].player1].leave(
            data.gameId
          );
          this.io.sockets.connected[this.games[data.gameId].player2].leave(
            data.gameId
          );
          delete this.games[data.gameId];
        }
      }, 1000);
    }
  }

  // When any player disconnect then it will handle the disconnect process.
  disconnect(client) {
    console.log("disconnect : " + client.id);
    if (typeof this.sockets[client.id] != "undefined") {
      if (this.sockets[client.id].is_playing) {
        this.io.to(this.sockets[client.id].game_id).emit("opponentLeft", {});
        this.players[
          this.sockets[this.games[this.sockets[client.id].game_id].player1]
            .mobile_number
        ].played--;
        this.players[
          this.sockets[this.games[this.sockets[client.id].game_id].player2]
            .mobile_number
        ].played--;
        this.io.sockets.connected[
          client.id == this.games[this.sockets[client.id].game_id].player1
            ? this.games[this.sockets[client.id].game_id].player2
            : this.games[this.sockets[client.id].game_id].player1
        ].leave(this.sockets[client.id].game_id);
        delete this.games[this.sockets[client.id].game_id];
      }
    }
    delete this.sockets[client.id];
    client.broadcast.emit("opponentDisconnected", {
      id: client.id,
    });
  }

  // Returns a game ID
  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

module.exports = Games;
