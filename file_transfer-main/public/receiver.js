(function(){

	const socket = io();
	const app = document.querySelector(".app");
	let sender_uid;

	let uname;
	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}

	document.querySelector("#receiver-start-con-btn").addEventListener("click",function(){
		sender_uid = document.querySelector("#join-id").value;
		let username = document.querySelector("#username").value;
		if(sender_uid.length == 0 && username.length == 0 ){
			return;
		}
		console.log('====================================');
		console.log( "sender id ");
		console.log( sender_uid );
		console.log('====================================');
		console.log('====================================');
		console.log( "sender id ");
		console.log( username );
		console.log('====================================');
		let joinID = generateID();
		console.log('====================================');
		console.log( "my id " );
		console.log( joinID );
		console.log('====================================');
		socket.emit("newuser",username);
		uname = username;
		socket.emit("receiver-join", {
			sender_uid:sender_uid,
			uid:joinID
		});
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});
	app.querySelector("#send-message").addEventListener("click",function(){
		let message = app.querySelector("#message-input").value;
		if(message.length  == 0){
			return;
		}
		renderMessage("my",{
			username:uname,
			text:message
		});
		socket.emit("chat",{
			username:uname,
			text:message
		});
		app.querySelector("#message-input").value = "";
	});
	app.querySelector(".chat-screen #exit-chat").addEventListener("click",function(){
		socket.emit("exituser",uname);
		window.location.href = window.location.href;
	});

	socket.on("update",function(update){
		renderMessage("update",update);
	});
	
	socket.on("chat",function(message){
		renderMessage("other",message);
	});

	function renderMessage(type,message){
		let messageContainer = app.querySelector(".fs-screen .chat-screen .messages");
		if(type == "my"){
			let el = document.createElement("div");
			el.setAttribute("class","message my-message");
			el.innerHTML = `
				<div>
					<div class="name">You</div>
					<div class="text">${message.text}</div>
				</div>
			`;
			messageContainer.appendChild(el);
		} else if(type == "other"){
			let el = document.createElement("div");
			el.setAttribute("class","message other-message");
			el.innerHTML = `
				<div>
					<div class="name">${message.username}</div>
					<div class="text">${message.text}</div>
				</div>
			`;
			messageContainer.appendChild(el);
		} else if(type == "update"){
			let el = document.createElement("div");
			el.setAttribute("class","update");
			el.innerText = message;
			messageContainer.appendChild(el);
		}
		// scroll chat to end
		messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
	}
	let fileShare = {};

	socket.on("fs-meta",function(metadata){
		fileShare.metadata = metadata;
		fileShare.transmitted = 0;
		fileShare.buffer = [];

		let el = document.createElement("div");
		el.classList.add("item");
		el.innerHTML = `
				<div class="progress">0%</div>
				<div class="filename">${metadata.filename}</div>
		`;
		document.querySelector(".files-list").appendChild(el);

		fileShare.progrss_node = el.querySelector(".progress");

		socket.emit("fs-start",{
			uid:sender_uid
		});
	});

	socket.on("fs-share",function(buffer){
		console.log("Buffer", buffer);
		fileShare.buffer.push(buffer);
		fileShare.transmitted += buffer.byteLength;
		fileShare.progrss_node.innerText = Math.trunc(fileShare.transmitted / fileShare.metadata.total_buffer_size * 100);
		if(fileShare.transmitted == fileShare.metadata.total_buffer_size){
			console.log("Download file: ", fileShare);
			download(new Blob(fileShare.buffer), fileShare.metadata.filename);
			fileShare = {};
		} else {
			socket.emit("fs-start",{
				uid:sender_uid
			});
		}
	});

})();