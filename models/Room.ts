import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true, unique: true },
  maxQueue: { type: Number, default: 3, min: 1 },
  isClosed: { type: Boolean, default: false },
  closedReason: { type: String, default: "" },
});

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);

export default Room;
