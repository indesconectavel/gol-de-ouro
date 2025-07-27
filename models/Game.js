import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    currentPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    gameStatus: {
      type: String,
      enum: ["waiting", "active", "finished"],
      default: "waiting",
    },
    winnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    prizeAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);
