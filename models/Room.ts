import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true, unique: true },
  isClosed: { type: Boolean, default: false },
  closedReason: { type: String, default: "" },
});

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);

export default Room;
