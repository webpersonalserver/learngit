
var Chat = function(socket){
	this.socket = socket;
};

//发送消息的函数
Chat.prototype.sendMessage = function(room,text){
	let message = {
		room:room,
		text:text
	};

	this.socket.emit('message',message);
};

//变更房间的函数
Chat.prototype.changeRoom = function(room){
	this.socket.emit('join',{
		newRoom:room
	});
};

Chat.prototype.processCommend = function(command){
	let sign = command.charAt(0),
		info = command.slice(1);
		message = false;

	switch(sign){
		case 'R':									
			this.changeRoom(info);						//处理房间的变换/更改
			break;
		case 'N':
			this.socket.emit('nameAttempt',info);		//处理更名尝试
			break;
		default:
			message = '信息错误！';
			break;
	}

	return message;
};
















