
//处理可疑的文本
function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}

//处理授信的文本
function divSystemContentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

//处理用户原始的输入信息
function processUserInput(chatApp,socket){
	let message = $('#send-message').val(),
		systemMessage;

	//如果用户输入的内容以斜杠(/)开头，将其作为1聊天命令
	if(message.charAt(0) == '/'){
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$("#messages").append(divSystemContentElement(systemMessage));
		}
	}else{
		//将非命令输入广播给其他用户
		chatApp.sendMessage($('#room').text(),message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}

	$('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function(){
	let chatApp = new Chat(socket);

	//监听昵称的更改
	socket.on('nameResult',function(result){
		let message;

		if(result.success){
			message = '你昵称更改为: ' + result.name;
		}else{
			message = result.message;
		}

		$('#messages').append(divSystemContentElement(message));
		$('#user-name').empty();
		$('#user-name').append(divSystemContentElement(result.name));
	});

	//监听房间的变更
	socket.on('joinResult',function(result){
		$('#room').text('(' + result.room + ')');
		$('#messages').append(divSystemContentElement('房间改变了！'));
	});

	//监听显示接收到的消息
	socket.on('message',function(message){
		let newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});

	//监听显示可用的房间列表
	socket.on('rooms',function(rooms){
		$('#room-list').empty();

		for(let room in rooms){
			room = room.substring(1,room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}

		//点击房间便换到那个房间中去
		$('#room-list div').click(function(){
			chatApp.processCommend('R' + $(this).text());
			$('#send-message').focus();
		});
	});

	//新建房间
	$('.add-room').click(function(){
		chatApp.processCommend('R' + 'newRoom');
		$('#send-message').focus();
	});

	//更改昵称
	$('#user-name').click(function(){
		chatApp.processCommend('N' + '周俊豪');
	});

	//定期请求可用房间列表
	setInterval(function(){
		socket.emit('rooms');
	},1000);

	$('#send-message').focus();

	//提交表单发送聊天消息
	$('#send-form').click(function(){
		processUserInput(chatApp,socket);
		return false;
	});


});