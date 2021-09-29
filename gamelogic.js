const generator = require('./solver_generator.js')

var io
var socket

var activeSocketIDs = {} //All active socketIDs and the assoc. username
var gameRooms = {} //Format: gameRooms[gameID] = [generatedBoard, solvedBoard, timeInSeconds]
var waitingForRematch = {} //Format: waiting[gameID] = [socket in room that has requested rematch first]
 
const connection = (clientIO, clientSocket) => {
    // initialize global variables
    io= clientIO
    socket=clientSocket

    // pushes this socket to the dict
    activeSocketIDs[socket.id] = "";

    // User 1 creates new game after clicking 'Create Game' on the frontend
    socket.on("createNewGame", createNewGame)

    // User joins gameRoom after going to a URL with '/game/:gameId' 
    socket.on("playerJoinsGame", playerJoinsGame)

    // Sends new move to the other socket session in the same room. 
    socket.on("newMove", newMove)

    socket.on("surrender", surrender)

    socket.on("disconnecting", onDisconnecting)

    socket.on("requestRematch", requestRematch)
}

function createNewGame(data) {
    //Generate a board and set the time
    var [board, solution]= generator.generateBoard(data.difficulty)
    gameRooms[data.gameID] = [board, solution, data.timeInSeconds]

    // Return the room's ID (gameID) and the socketID to the client
    this.emit('gameWasCreated', {gameID: data.gameID, socketID: this.id});

    // Create a new channel and join it
    this.join(data.gameID)
}

function playerJoinsGame(data){
    var gameRoom = io.sockets.adapter.rooms[data.gameID] //gameRoom with name "gameID"

    if(gameRoom=== undefined){
        this.emit('joinAttempt' , "undefined");
        return;
    }
    else if(gameRoom.length <2){
        this.join(data.gameID) //Creator joining twice is not a problem
        activeSocketIDs[socket.id] = data.username 

        if(gameRoom.length===2){//Game full after joining
            io.to(data.gameID).emit('playerTwoJoined', 
            {username1: activeSocketIDs[Object.getOwnPropertyNames(gameRoom.sockets)[0]], 
                username2: activeSocketIDs[Object.getOwnPropertyNames(gameRoom.sockets)[1]],
                creatorIsPlayerA: (Math.random() < 0.5), //Chooses the starting player at random
                generatedBoard: gameRooms[data.gameID][0],
                generatedSolution: gameRooms[data.gameID][1],
                timeInSeconds: gameRooms[data.gameID][2]
            })
        }

    }
    else{
        this.emit('joinAttempt' , "full");
    }
}

function newMove(data){
    io.to(data.gameID).emit('newMove', data) 
}

function surrender(data){
    io.to(data.gameID).emit('surrender', data)
}

function onDisconnecting() {  
    delete activeSocketIDs[this.id]
    for (let room of Object.keys(this.rooms).filter(roomName => roomName!=this.id)){
        io.to(room).emit('OtherPlayerLeft')  //emit to gameRoom that you left
        this.leave(room)
        if(!io.sockets.adapter.rooms[room]){
            delete gameRooms[room]
        }
    }
}

function requestRematch(data){
    if(data.gameID in waitingForRematch){//One player already waiting
        if(waitingForRematch[data.gameID]!==this.id){
            io.to(data.gameID).emit('startRematch', 
            {creatorIsPlayerA: (Math.random() < 0.5),
            gameID: data.gameID, 
            generatedBoard: gameRooms[data.gameID][0],
            generatedSolution: gameRooms[data.gameID][1],
            timeInSeconds: gameRooms[data.gameID][2]
            })

            delete waitingForRematch[data.gameID]
        }
    }
    else{
        waitingForRematch[data.gameID]= this.id
    }
}

 exports.connection = connection