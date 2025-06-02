"use strict";
// server.ts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Hapi = __importStar(require("@hapi/hapi"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./db/connection");
const userController_1 = require("./src/userModule/userController"); // ➜ Only routes we keep
dotenv_1.default.config();
/**
 * Bootstraps the Hapi server and connects to MongoDB.
 */
async function init() {
    const server = Hapi.server({
        host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
        port: parseInt(process.env.PORT || '3000', 10),
        routes: {
            cors: {
                origin: [
                    'http://localhost:3001',
                    'https://leave-management-system-frontend.vercel.app',
                    'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app',
                    'https://leave-management-system-frontend-psi.vercel.app',
                    'https://leave-management-system-frontend-mznds8m7u-harishmugis-projects.vercel.app',
                ],
                credentials: true,
            },
        },
    });
    /* ------------------------  Database connection  ------------------------ */
    try {
        await connection_1.dataSource.initialize();
        console.log('✅ Database connected');
    }
    catch (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    }
    /* ------------------------------  Routes  ------------------------------- */
    server.route(userController_1.userRoute); // only employee-creation routes
    /* ------------------------------  Start  -------------------------------- */
    await server.start();
    console.log(`🚀 Server running at: ${server.info.uri}`);
}
/* --------------------  Global unhandled rejection hook  ------------------ */
process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err);
    process.exit(1);
});
init();
