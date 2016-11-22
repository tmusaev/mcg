// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var stormpath = require('express-stormpath');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(stormpath.init(app, {
  expand: {
    customData: true
  }
}));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/user', stormpath.getUser, function (request, response) {
  if(request.user) {
    response.send(request.user.fullName);
  }
  else {
    response.send('error');
  }
});

var users = new Map(); //maps socket.id to username
var ids = new Map(); //maps usernames to socket.id

io.on('connection', function(socket){
  io.to(socket.id).emit('myId', socket.id); //send id back so it knows itself
  //users.add(socket.id);
  //io.emit('users', Array.from(users));
  //io.emit('broadcast', socket.id+' has logged in.');
  
  socket.on('debug', function(msg){
    console.log(msg);
  });
  
  socket.on('connectToServer', function(user) {
    users.set(socket.id, user);
    ids.set(user, socket.id);
    var arr = [];
    for(var key of users.keys()) {
      arr.push(users.get(key));
    }
    io.emit('users', arr);
    io.emit('broadcast', user+' has logged in.');
  });
  
  socket.on('chat message', function(msg, user){
    io.emit('chat message', msg, user);
  });
  
  socket.on('challenge', function(toUser){
    var from = users.get(socket.id);
    var to = ids.get(toUser);
    io.to(to).emit('challenge', from);
  });
  
  socket.on('disconnect', function(){
    if(users.has(socket.id)) {
      console.log("disconnecting!");
      io.emit('broadcast', users.get(socket.id)+' has logged out.');
      users.delete(socket.id);
      ids.delete(user);
      var arr = [];
      for(var key of users.keys()) {
        arr.push(users.get(key));
      }
      io.emit('users', arr);
      console.log(users);
    }
  });
});

var listener = http.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});