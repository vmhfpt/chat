
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  name :{
    type : String,
    unique: true
  },
  password : { type: String, bcrypt: true },
},
{ timestamps : true}
);
UserSchema.plugin(require('mongoose-bcrypt'));
module.exports =  mongoose.model("User", UserSchema);