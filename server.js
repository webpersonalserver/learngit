
var http = require("http"),		//内置的http模块提供了HTTP服务器和客户端功能
	fs = require("fs"),			//内置的path模块提供了与文件系统路径相关的功能
	path = require("path"),		//内置的http模块提供了HTTP服务器和客户端功能
	mime = require("mime"),		//附加的mime模块有根据文件扩展名得出MIME类型的能力
	cache = {},					//cache是用来缓存文件内容的对象
	chatServer = require("./lib/chat_server");

// 用来处理请求数据不存在时的操作
function send404(response){
	response.writeHead(404,{'Content-Type': 'text/plain'});
	response.write("Error 404: response not found.");
	response.end();
}

//提供文件数据服务,即请求成功返回回应数据
function sendFile(response,filePath,fileContents){
	response.writeHead(
		200,
		{'Content-Type': mime.lookup(path.basename(filePath))}
	);

	response.end(fileContents);
}

//提供静态文件服务，确定文件是否缓存,并根据请求做出回应处理
function serverStatic(response,cache,absPath){
	//检测文件是否被缓存
	if(cache[absPath]){
		sendFile(response,absPath,cache[absPath]);
	}else{
		//如若没被缓存则检测文件是否存在
		fs.exists(absPath,function(exists){
			if(exists){
				//文件存在，则从硬盘读取出来
				fs.readFile(absPath,function(err,data){
					if(err){
						send404(response);
					}else{
						//文件读取成功则记录到缓存中，并返回请求数据
						cache[absPath] = data;
						sendFile(response,absPath,data);
					}
				});
			}else{
				send404(response);
			}
		});
	}

}


//创建http服务器，用来处理http请求,并用匿名函数定义对每个请求的处理行为
var server = http.createServer(function(request,response){
	let filePath = false;

	//根据请求地址做出相应的行为反应
	if(request.url == '/'){
		filePath = 'public/index.html';		//确定返回的默认HTML文件
	}else{
		filePath = 'public' + request.url;	//将URL路径转为文件的相对路径
	}

	let absPath = './' + filePath;
	serverStatic(response,cache,absPath);
});

//监听端口
server.listen(3000,function(){
	console.log("Server listening on port 3000.");
});

//启动Socket.IO服务器，给她提供一个已经定义好的HTTP服务
//这样就能跟HTPP服务器共享同一个TCP/IP端口
chatServer.listen(server);









