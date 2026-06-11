import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true, unique: true },
  maxQueue: { type: Number, default: 3, min: 1 },
  isClosed: { type: Boolean, default: false },
  closedReason: { type: String, default: "" },
});

// Force recompile during development so schema changes take effect
if (mongoose.models.Room) {
  delete mongoose.models.Room;
}

const Room = mongoose.model("Room", RoomSchema);

export default Room;
