"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingModule = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LearningSectionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String, default: 'book' },
    highlights: [{ type: String }],
}, { _id: false });
const SecurityExampleSchema = new mongoose_1.Schema({
    scenario: { type: String, required: true },
    correctAction: { type: String, required: true },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    clinicalImpact: { type: String },
}, { _id: false });
const TrainingContentSchema = new mongoose_1.Schema({
    introduction: { type: String, required: true },
    sections: [LearningSectionSchema],
    examples: [SecurityExampleSchema],
    keyTakeaways: [{ type: String }],
}, { _id: false });
const TrainingModuleSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Training title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Training description is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: [
            'Patient Data Confidentiality',
            'Phishing Awareness',
            'Social Engineering',
            'Password Hygiene',
            'Device Security',
            'Physical Security',
        ],
        required: true,
    },
    durationMinutes: {
        type: Number,
        default: 15,
        required: true,
    },
    content: {
        type: TrainingContentSchema,
        required: true,
    },
    assignedRoles: {
        type: [String],
        default: [], // Empty array = all roles
    },
    assignedDepartments: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Department',
        },
    ],
    dueDate: {
        type: Date,
        default: null,
    },
    passingScore: {
        type: Number,
        default: 80,
        min: 50,
        max: 100,
        required: true,
    },
    version: {
        type: String,
        default: '1.0',
        required: true,
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Published',
        required: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
TrainingModuleSchema.index({ status: 1, category: 1 });
exports.TrainingModule = mongoose_1.default.model('TrainingModule', TrainingModuleSchema);
