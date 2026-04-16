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
exports.JoseJwtService = void 0;
const jose = __importStar(require("jose"));
class JoseJwtService {
    constructor(secret, expiresIn) {
        this.secret = secret;
        this.expiresIn = expiresIn;
    }
    async sign(payload, options) {
        const secret = new TextEncoder().encode(this.secret);
        return new jose.SignJWT({
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            tokenType: payload.tokenType ?? 'access',
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject(payload.sub)
            .setExpirationTime(options?.expiresIn ?? this.expiresIn)
            .sign(secret);
    }
    async verify(token, expectedTokenType) {
        try {
            const secret = new TextEncoder().encode(this.secret);
            const { payload } = await jose.jwtVerify(token, secret);
            const sub = payload.sub ?? payload['sub'];
            const role = payload.role ?? payload['role'];
            const tokenType = payload.tokenType ?? payload['tokenType'] ?? 'access';
            if (typeof sub !== 'string' || typeof role !== 'string')
                return null;
            if (tokenType !== 'access' && tokenType !== 'refresh')
                return null;
            if (expectedTokenType !== undefined && expectedTokenType !== tokenType)
                return null;
            return { sub, role, tokenType };
        }
        catch {
            return null;
        }
    }
    getExpiresIn() {
        return this.expiresIn;
    }
}
exports.JoseJwtService = JoseJwtService;
