
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CommentSchema = new Schema(
  {
    content: String,
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", CommentSchema);
