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
exports.TrainingProgress = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserQuizAnswerSchema = new mongoose_1.Schema({
    questionId: { type: String, required: true },
    selectedOption: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
}, { _id: false });
const TrainingProgressSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    trainingModuleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TrainingModule',
        required: true,
    },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed', 'Overdue'],
        default: 'Not Started',
        required: true,
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    quizAnswers: [UserQuizAnswerSchema],
    startedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    dueDate: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
TrainingProgressSchema.index({ userId: 1, trainingModuleId: 1 }, { unique: true });
TrainingProgressSchema.index({ status: 1 });
TrainingProgressSchema.index({ userId: 1 });
TrainingProgressSchema.index({ trainingModuleId: 1 });
exports.TrainingProgress = mongoose_1.default.model('TrainingProgress', TrainingProgressSchema);
