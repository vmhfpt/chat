var express = require("express");
const http = require("http");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

var bodyParser = require("body-parser");
const User = require("./model/User.js");
const Message = require("./model/Message.js");
const Conversation = require("./model/Conversation.js");
const GroupMember = require("./model/GroupMember.js");
const Messenger = require("./model/Messenger.js");
const db = require("./config/database");
const cors = require("cors");
var app = express();
app.use(cors());
app.use(morgan("combined"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

db.connect();
const server = http.createServer(app);

//////////////////////////////////////////////////////////////////////////

app.get("/add-conversation", (req, res) => {
  return Conversation.create(req.body).then((data) => {
    return res.json(data);
  });
});
app.get("/add-ground-chat", (req, res) => {
  return GroupMember.create({
    user_first: req.body.user_first,
    user_second: req.body.user_second,
    conversation_id: req.body.conversation,
  }).then((data) => {
    return res.json(data);
  });
});
app.get("/add-messenger", (req, res) => {
  return Messenger.create({
    content: req.body.content,
    user_id: req.body.user_id,
    conversation_id: req.body.conversation,
  }).then((data) => {
    return res.json(data);
  });
});
app.post("/get-chat-private", (req, res) => {
  Messenger.find({ conversation_id: req.body.id })
    .populate("user_id", "-password -__v -createdAt -updatedAt")
    .then((data) => {
      return res.json(data);
    });
});
app.post("/get-chat-room", (req, res) => {
  return GroupMember.find({
    $or: [
      {
        user_first: req.body.user_id,
      },
      {
        user_second: req.body.user_id,
      },
    ],
  })
    .populate("user_first")
    .populate("user_second")
    .then((data) => {
      return res.json(data);
    });
});

/////////////////////////////////////////////////////////////////////////////////////
app.post("/get-member-chat", (req, res) => {
  return Promise.all([
    GroupMember.findOne({
      user_first: req.body.id_first,
      user_second: req.body.id_second,
    }),
    GroupMember.findOne({
      user_first: req.body.id_second,
      user_second: req.body.id_first,
    }),
  ]).then(([dataFirst, dataSecond]) => {
    if (dataFirst === null && dataSecond === null) {
      return res.json({conversation_id : false});
    } else {
      let conversation_id;
      if (dataFirst === null) {
        conversation_id = dataSecond.conversation_id;
      } else {
        conversation_id = dataFirst.conversation_id;
      }
      return res.json({conversation_id});
 
    }
    // return res.json({dataFirst, dataSecond});
  });
});
app.post("/register", (req, res) => {
  //return res.json({data : req.body})
  return User.create(req.body)
  .then((data) => {

    return res.json({status : "success", data});
  })
  .catch((error) => {
    return res.json({status : "error" , message : error.keyValue.name + " Đã có người đăng ký"  });
  })
});
app.post("/post-comment/room", (req, res) => {
  return Message.create({
    user_id: req.body.id,
    content: req.body.content,
  }).then((data) => {
    return res.json(data);
  });
});
app.get("/get-message", (req, res) => {
  return Message.find({})
    .populate("user_id", "-password -__v")
    .then((data) => {
      return res.json(data);
    });
});
app.get("/user-get", (req, res) => {
  return User.find({}).then((data) => {
    return res.json(data);
  });
});
app.post("/login", (req, res) => {
  return User.findOne({ name: req.body.name }).then((data) => {
    if (data === null)
      return res.json({ status: "error", message: "Tên chưa được đăng ký" });
    return data.verifyPassword(req.body.password).then((item) => {
      if (item) {
        const { _id, name } = data;
        return res.json({ status: "success", data: { _id, name } });
      } else {
        return res.json({
          status: "error",
          message: "Mật khẩu không chính xác",
        });
      }
    });
  });
});
//app.use(morgan('combined'));
const socketIo = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const users = {};
socketIo.on("connection", (socket) => {
  socket.on("sendDataClientNewRegister", function(data) {
    socketIo.emit("sendDataServerNewRegister", { data });
  })
  socket.on("sendDataClientPrivate", function (data) {

  if(data.conversation_id === false){
      return Conversation.create({
        name : "123123"
      }).then((dataConversation) => {
            //user_second_id, user_id
          return Promise.all([
            GroupMember.create({
              conversation_id : dataConversation._id,
              user_first :  data.user_id,
              user_second : data.user_second_id
            })
            ,
            Messenger.create({content : data.content, user_id : data.user_id, conversation_id : dataConversation._id })
          ])
          .then(([dataGroupMemberID, dataMessengerID]) => {
              return Promise.all([
                 GroupMember.findById(dataGroupMemberID._id)
                 .populate("user_first")
                 .populate("user_second"),
                 Messenger.findById(dataMessengerID._id)
                 .populate("user_id", "-password -__v")
              ])
              .then(([dataGroupMember, dataMessenger]) => {
                const dataResponse = {dataGroupMember, dataMessenger}
                socketIo.emit("sendDataServerPrivateAddNewChat", { dataMessenger });
                socketIo.emit("sendDataServerPrivateAddNewChatList", { dataGroupMember });
              })

            
          })
      })
  }else {
    return Messenger.create(data).then((dataItem) => {
      return Messenger.findById(dataItem._id)
        .populate("user_id", "-password -__v")
        .then((dataMessage) => {
          const {content, conversation_id} = dataMessage;
          socketIo.emit("sendDataServerPrivate", { dataMessage });
          socketIo.emit("sendDataServerNewTopMessage", {content, conversation_id})
        });
    });
  }
  });

  socket.on("login", function (data) {
    users[socket.id] = data.userId;
    socketIo.emit("sendDataServerOnline", { users });
  });

  socket.on("sendDataClient", function (data) {
    return Message.create({
      user_id: data.id,
      content: data.content,
    }).then((dataItem) => {
      return Message.findById(dataItem._id)
        .populate("user_id", "-password -__v")
        .then((dataMessage) => {
          socketIo.emit("sendDataServer", { dataMessage });
        });
    });
    //  socketIo.emit("sendDataServer", { data });
  });
  socket.on("sendDataClientTyping", function (data) {
    socketIo.emit("sendDataServerTyping", { data });
  });

  socket.on("sendDataClientTypingPrivate", function (data) {
    socketIo.emit("sendDataServerTypingPrivate", { data });
  });
  /* socket.on("sendDataClient", function(data) { 
    socketIo.emit("sendDataServer", { data });
  })*/

  socket.on("disconnect", () => {
    delete users[socket.id];
    socketIo.emit("sendDataServerOnline", { users });
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`server run  running at http://localhost:5000`);
});
