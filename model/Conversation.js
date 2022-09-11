
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ConversationSchema = new Schema(
  {
    name: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Conversation", ConversationSchema);
