
var socketio = require("socket.io"),		//引用Socket.IO模块
	io,
	guestNumber = 1,
	nickNames = {},			//存放用户昵称
	namesUsed = [],			//已被占用昵称
	currentRoom = {};		//当前聊天室

//为连接进聊天室的用户分配昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
	let name = 'Guest' + guestNumber;

	//把用户昵称跟客户端连接ID关联上
	nickNames[socket.id] = name;
	//让用户知道他们的昵称
	socket.emit('nameResult',{
		success:true,
		name:name
	});
	//存放已被占用的昵称
	namesUsed.push(name);

	return guestNumber + 1;
}

//将连接进的用户加入聊天室
function joinRoom(socket,room){
	//加入名叫什么的聊天室
	socket.join(room);
	//记录用户的当前房间
	currentRoom[socket.id] = room;
	//告知用户进入摸某个房间
	socket.emit('joinResult',{room:room});
	//让房间的其他用户知道有新的用户进入房间
	socket.broadcast.to(room).emit('message',{
		text:nickNames[socket.id] + '进入' + room + '。'
	});

	//获取连接摸个房间的房间或所有用户信息，即都有哪些用户
	let usersInRoom = io.sockets.clients(room);
	//如果该房间用户不止一个
	if(usersInRoom.length > 1){
		let usersInRoomSummary = room + '房间的成员有：';
		for(let index in usersInRoom){
			let userSocketId = usersInRoom[index].id;
			//遍历中，如果用户id不是当前进入房间的用户
			if(usersInRoom[index].id != socket.id){
				if(index > 0){
					usersInRoomSummary += ',';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}

		usersInRoomSummary += '。';
		//发送消息告知当前用户
		socket.emit('message',{text:usersInRoomSummary});
	}
}

//处理昵称变更请求
function handleNameChangeAtempts(socket,nickNames,namesUsed){
	//添加nameAttempt事件监听器
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest') == 0){
			socket.emit('nameResult',{
				success:false,
				message:'昵称不能以“Guest”开头！'
			});
		}else{
			//检测昵称是否已经存在
			if(namesUsed.indexOf(name) < 0){
				let previousName = nickNames[socket.id],
					previousNameIndex = namesUsed.indexOf(previousName);

				namesUsed.splice(previousNameIndex,1);
				namesUsed.push(name);
				nickNames[socket.id] = name;

				//系统提示更改昵称成功
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				//将昵称更改的发送给聊天室中的其他人
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:'您的朋友 "' + previousName + '" 将昵称更改为 "' + name + '"'
				});
			}else{
				socket.emit('nameResult',{
					success:false,
					message:'该昵称已存在，请重新填写！'
				});
			}
		}
	});
}

//发送聊天消息
function handleMessageBroadcasting(socket,nickNames){
	//Socket.IO的broadcast函数是用来转发消息的
	socket.on('message',function(message){
		socket.broadcast.to(currentRoom[socket.id]).emit('message',{
			text:nickNames[socket.id] + ": " + message.text
		});
	});
}

//创建或变更房间
function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}

//用户断开连接
function handleClientDisconnection(socket,nickNames,namesUsed){
	socket.on('disconnect',function(){
		let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		namesUsed.splice(nameIndex,1);
		delete nickNames[socket.id];
	});
}

exports.listen = function(server){
	//启动Socket.IO服务器，允许其搭载到已有的HTTP服务上
	io = socketio.listen(server);
	io.set('log level',1);

	//定义每个用户链接的处理逻辑
	io.sockets.on('connection',function(socket){
		//在用户链接上来时赋予其一个访客
		guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
		//在用户连接上来时把他放入聊天室Lobby
		joinRoom(socket,'Lobby');

		/*处理用户的消息，更名，以及聊天室的创建和变更*/
		handleMessageBroadcasting(socket,nickNames);
		handleNameChangeAtempts(socket,nickNames,namesUsed);
		handleRoomJoining(socket);
		/*处理用户的消息，更名，以及聊天室的创建和变更*/

		//用户发出请求时，向其提供已被占用的聊天室的列表
		socket.on('rooms',function(){
			socket.emit('rooms',io.sockets.manager.rooms);
		});

		//定义用户断开连接后的清除逻辑
		handleClientDisconnection(socket,nickNames,namesUsed);
	});
}
