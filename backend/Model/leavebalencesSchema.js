const mongoose= require("mongoose");
const leaveBalances = new mongoose.Schema({
    employeeId :{ type: mongoose.Schema.Types.ObjectId, ref:"Employee",
        required: true
    },
    year:{type:Number, required: true},
    leaves:[
        {
            type:{type:String, required:true},
            total:{type:Number, required:true},
            used:{type:Number, required:true},
            available:{type:Number, default:0},
        }
    ]
},{timestamps:true});
module.exports = mongoose.model("leaveBalances", leaveBalances);