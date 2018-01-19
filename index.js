function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
let players = [];//all vella players
let busy = [];
let io = require("socket.io")();
io.on('connection',(socket) => {
	console.log('user is connected',socket.id); 
	
	socket.emit('init',{"id":socket.id});
	
	socket.on('username',(param) => {
		players.push(Object.assign({},{'username':param.username,"id":socket.id,'status':'vella','playingwith':null}));
	});

	socket.on('disconnect',() => {
		console.log("%c server =>  ",'background:#222;color:#f00',"user is diconnecting => ",socket.id);
		let index;
		for(let i=0;i<players.length;i++){
			if(socket.id === players[i].id){
				index=i;
				break;
			}
		}
		players.splice(index,1);
		//remove player for list 
	});

	socket.on("turn",param => {
				console.log("%c server =>  ",'background:#222;color:#f00',"turn parameter => ",param);
				let playerID;
				let opponentIndex = param.opponentIndex;
				playerID = players[opponentIndex].id;
				console.log(param.squares);
				let symbol = calculateWinner(param.squares);
				if(symbol !== null)
				{
					socket.emit("winner",{"symbol":symbol});
					socket.to(playerID).emit("winner",{"symbol":symbol});
				}
				else{
					socket.emit("turn",{"squares":param.squares,"id":`${playerID}`});
					socket.to(playerID).emit("turn",{"squares":param.squares,"id":`${playerID}`});
				}
				
				
			});

	socket.on('search',param => {
		
		let busyPlayer1,busyPlayer2;
		let playerLength = players.length;
		let foundOpponent = false;

		//search the player 
		console.log("%c server =>  ",'background:#222;color:#f00',param,"search player player _id");
		if(playerLength>1){
		
		//linear search //replace with binary search
		for(let i=0;i<playerLength;i++){
			if(players[i].id===param.id){
				busyPlayer1 = i;
			}
		}

		//search for opponent //replace with binary search
		for(let i=0;i<playerLength;i++){

			if(players[i].id===param.id){
				continue;
			}
			if(players[i].status==="vella"){
				busyPlayer2 = i;
				players[busyPlayer1].status = "busy";
				players[i].status = "busy";
				foundOpponent = true;
				break;
			}
		}
		//if opponent found
		if(foundOpponent)
		{
			players[busyPlayer1].playingwith = players[busyPlayer2].id;
			players[busyPlayer2].playingwith = players[busyPlayer1].id;
			busy.push(Object.assign({},
			{
				"player1":
				{
					"_id":param.id,
					"index":busyPlayer1
				},
				"player2":
				{
					"_id":players[busyPlayer2].id,
					"index":busyPlayer2
				}
				
			}
			));
			socket.emit("playersconnected",{"opponentIndex":busyPlayer2,"mIndex":busyPlayer1});
			socket.to(players[busyPlayer2].id).emit("playersconnected",{"opponentIndex":busyPlayer1,"mIndex":busyPlayer2});
			socket.emit("startgame",{"id":`${param.id}`,"symbol":"X"});
			socket.to(players[busyPlayer2].id).emit("startgame",{"id":`${param.id}`,"symbol":"O"});

			
		}
		else{
			socket.emit("noplayers","all are busy");

		}

		}
		else{
			socket.emit("noplayers","just one player");
		}
		
	})
});
io.listen(3000);
console.log('listening on port ', 3000);