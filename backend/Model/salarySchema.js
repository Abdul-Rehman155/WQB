const mongoose = require('mongoose');

const SalaryComponentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    type: { 
        type: String, 
        enum: ['Earning', 'Deduction'], 
        default: 'Earning' 
    },
    calculationType: { 
        type: String, 
        enum: ['Fixed', 'Percentage'], 
        default: 'Fixed' 
    },
    value: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        default: 'Active' 
    }
}, { timestamps: true });

module.exports = mongoose.model('SalaryComponent', SalaryComponentSchema);