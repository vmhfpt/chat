
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MessengerSchema = new Schema(
  {
    content: String,
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        default: null,
      },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Messenger", MessengerSchema);
