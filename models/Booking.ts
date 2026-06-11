import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  roomName: { type: String, required: true },
  bookedFor: { type: String, required: true },
  bookedBy: { type: String, required: true },
  bookingStart: { type: Date, required: true },
  bookingEnd: { type: Date, required: true },
  queuePosition: { type: Number, required: true, min: 1, max: 3 },
  status: {
    type: String,
    enum: ["approved", "pending_approval", "rejected"],
    default: "pending_approval",
  },
  needsApproval: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient overlap queries
BookingSchema.index({ roomId: 1, bookingStart: 1, bookingEnd: 1 });
BookingSchema.index({ status: 1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

export default Booking;
