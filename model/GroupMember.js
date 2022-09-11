
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const GroupMemberSchema = new Schema(
  {
    user_first: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    user_second: {
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
module.exports = mongoose.model("Group_member", GroupMemberSchema);
