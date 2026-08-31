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
exports.Incident = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const IncidentNoteSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const IncidentSchema = new mongoose_1.Schema({
    incidentNumber: {
        type: String,
        unique: true,
        required: true,
    },
    reportedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    incidentType: {
        type: String,
        enum: [
            'Lost Device',
            'Phishing',
            'Suspicious Email',
            'Unauthorized Access',
            'Password/Security Issue',
            'Other',
        ],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Incident title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Incident description is required'],
        trim: true,
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
        required: true,
    },
    status: {
        type: String,
        enum: ['Open', 'In Review', 'Resolved'],
        default: 'Open',
        required: true,
    },
    department: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    resolutionNotes: {
        type: String,
        default: '',
    },
    notes: [IncidentNoteSchema],
    resolvedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
IncidentSchema.index({ status: 1, priority: 1 });
IncidentSchema.index({ reportedBy: 1 });
exports.Incident = mongoose_1.default.model('Incident', IncidentSchema);
