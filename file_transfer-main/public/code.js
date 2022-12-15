(function(){

	let receiverID = [];
	// let receiverID;
	const socket = io();

	const app = document.querySelector(".app");

	let uname;
	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}

	document.querySelector("#sender-start-con-btn").addEventListener("click",function(){
		let username = app.querySelector("#username").value;
		console.log('====================================');
		console.log( username);
		console.log('====================================');
		if(username.length == 0){
			return;
		}
		socket.emit("newuser",username);
		uname = username;
		let joinID = generateID();
		document.querySelector("#join-id").innerHTML = `
			<b>Room ID</b>
			<span>${joinID}</span>
		`;
		socket.emit("sender-join", {
			uid:joinID
		});
	});

	socket.on("init",function(uid){
		console.log('====================================');
		console.log( "client id = " + uid );
		console.log('====================================');
		receiverID.push(uid)
		// receiverID = uid
		console.log( receiverID );
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});

	app.querySelector("#send-message").addEventListener("click",function(){
		let message = app.querySelector("#message-input").value;
		console.log('====================================');
		console.log( message );
		console.log('====================================');
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

	app.querySelector("#exit-chat").addEventListener("click",function(){
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

	document.querySelector("#file-input").addEventListener("change",function(e){
		console.log('====================================');
		console.log( "caling" );
		console.log('====================================');
		let file = e.target.files[0];
		if(!file){
			return;		
		}
		let reader = new FileReader();
		console.log('====================================');
		console.log( reader);
		console.log('====================================');
		reader.onload = function(e){
			let buffer = new Uint8Array(reader.result);

			let el = document.createElement("div");
			el.classList.add("item");
			el.innerHTML = `
					<div class="progress">0%</div>
					<div class="filename">${file.name}</div>
			`;
			document.querySelector(".files-list").appendChild(el);
			for (let index = 0; index < receiverID.length; index++) {
				shareFile({
					filename: file.name,
					total_buffer_size:buffer.length,
					buffer_size:1024,
				}, buffer, el.querySelector(".progress"),receiverID[index] );
			}	
			
		}
		reader.readAsArrayBuffer(file);
	});


	function shareFile(metadata,buffer,progress_node, node_id){
		console.log('====================================');
		console.log( "file share ", node_id );
		socket.emit("file-meta", {
			uid:node_id,
			metadata:metadata
		});	
		socket.on("fs-share",function(){
			let chunk = buffer.slice(0,metadata.buffer_size);
			buffer = buffer.slice(metadata.buffer_size,buffer.length);
			progress_node.innerText = Math.trunc(((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100));
			if(chunk.length != 0){
				socket.emit("file-raw", {
					uid:node_id,
					buffer:chunk
				});
			} else {
				console.log("Sent file successfully");
			}
		});
	}
})();