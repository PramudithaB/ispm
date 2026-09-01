"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/securehemas',
    jwtSecret: process.env.JWT_SECRET || 'securehemas_jwt_super_secret_key_2026_clinical_defense_secure',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'securehemas_jwt_refresh_super_secret_key_2026_clinical_defense_secure',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
