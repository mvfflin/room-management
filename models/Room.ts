import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true },
  booked: { type: Boolean, required: true, default: false },
  bookedFor: { type: String },
  bookingStart: { type: Date },
  bookingEnd: { type: Date },
});

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);

export default Room;
