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
    regnNo: { type: Number },
    hobbies : {type: String},
    branch : {type: String},
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
    // Membership status within the platform — NOT an academic year.
    role: { type: String, enum: ["applicant", "member"], default: "applicant" },
    clubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Organization"
    }],
    // Academic year (FE/SE/TE/BE) — NOT a membership role.
    year: {
        type: String,
        enum: ["FE", "SE", "TE", "BE"],
        required: function () {
            return this.authProvider === "local";
        }
    },
    bio: { type: String, default: "Too lazy to type" },
    number: { type: Number, unique: true },

    avatar:{ type:String },
    resume:{ type:String },
    
    googleId: {
        type: String,
    },
    forms: [{
        type: mongoose.Schema.Types.ObjectId
    }]

}, { timestamps: true })

userSchema.pre('validate', function () {
    if (!['applicant', 'member'].includes(this.role)) {
        this.role = 'applicant';
    }
});

userSchema.index(
    { regnNo: 1 }, 
    {
        unique: true,
        sparse: true   // allows multiple docs with null/undefined callSign
    }
);

const userModel = mongoose.model.user || mongoose.model('user', userSchema)
export default userModel