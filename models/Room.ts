import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true, unique: true },
});

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);

export default Room;
