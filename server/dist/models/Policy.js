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
exports.Policy = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PolicyVersionSchema = new mongoose_1.Schema({
    version: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    changelog: { type: String, default: '' },
    publishedAt: { type: Date },
    archivedAt: { type: Date },
    changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });
const PolicySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Policy title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Policy description is required'],
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Policy content is required'],
    },
    category: {
        type: String,
        enum: [
            'Data Privacy & Confidentiality',
            'Access Control & Passwords',
            'Device & Endpoint Security',
            'Incident Response',
            'Physical & Environmental Security',
            'Acceptable Use Policy',
        ],
        required: true,
        default: 'Data Privacy & Confidentiality',
    },
    department: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Department',
        default: null, // null means applies to all departments
    },
    version: {
        type: String,
        required: true,
        default: '1.0',
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Draft',
        required: true,
    },
    effectiveDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    publishedAt: {
        type: Date,
        default: null,
    },
    changelog: {
        type: String,
        default: 'Initial policy creation',
    },
    previousVersions: [PolicyVersionSchema],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
PolicySchema.index({ status: 1, category: 1 });
PolicySchema.index({ department: 1 });
exports.Policy = mongoose_1.default.model('Policy', PolicySchema);
