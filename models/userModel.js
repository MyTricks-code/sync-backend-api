import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
    name: {
        type: String, required: function () {
            return this.authProvider === "local";
        }
    },
    callSign: { type: String},
    email: {
        type: String, required: function () {
            return this.authProvider === "local";
        }, unique: true
    },
    password: {
        type: String, required: function () {
            return this.authProvider === "local";
        }
    },
    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
    role: { type: String, default: "rookie" },
    clubs: { type: Array, default: [] },
    year: {
        type: String, required: function () {
            return this.authProvider === "local";
        }
    },
    bio: { type: String, default: "Rookie Here. Guide me please hui hui" },
    number: { type: Number },
    googleId: {
        type: String,
    },
    
}, { timestamps: true })

userSchema.index(
  { callSign: 1 },
  {
    unique: true,
    partialFilterExpression: { authProvider: "local" }
  }
);

const userModel = mongoose.model.user || mongoose.model('user', userSchema)
export default userModel