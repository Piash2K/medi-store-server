import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import getFirebaseAdmin from "../../lib/firebaseAdmin";
import { OAuth2Client } from "google-auth-library";

type GoogleAuthPayload = {
    email?: string;
    name?: string;
    profileImage?: string;
    uid?: string;
    idToken?: string;
    token?: string;
    credential?: string;
    role?: "CUSTOMER" | "SELLER" | "ADMIN";
};

type VerifiedGoogleIdentity = {
    uid: string;
    email: string;
    emailVerified: boolean;
};

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT secret is not configured");
    }
    return secret;
};

const getGoogleClientIds = () => {
    const rawValue = process.env.GOOGLE_CLIENT_ID;
    if (!rawValue) {
        return [];
    }

    return rawValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
};

const verifyGoogleIdentityToken = async (token: string): Promise<VerifiedGoogleIdentity> => {
    try {
        const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
        const email = decoded.email?.trim().toLowerCase();

        if (!email) {
            throw new Error("Invalid Google token");
        }

        return {
            uid: decoded.uid,
            email,
            emailVerified: !!decoded.email_verified,
        };
    } catch (firebaseError) {
        const oauthClient = new OAuth2Client();
        const clientIds = getGoogleClientIds();
        const verificationOptions = clientIds.length
            ? { idToken: token, audience: clientIds }
            : { idToken: token };

        const ticket = await oauthClient.verifyIdToken(verificationOptions);
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email) {
            throw new Error("Invalid Google token");
        }

        return {
            uid: payload.sub,
            email: payload.email.trim().toLowerCase(),
            emailVerified: !!payload.email_verified,
        };
    }
};

const createUserIntoDB = async (payload: any) => {
    // Basic validation
    if (!payload.email || !payload.password || !payload.name) {
        throw new Error("Name, email, and password are required");
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
        throw new Error("Invalid email format");
    }
    // Password strength validation (min 6 chars)
    if (payload.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }
    // Check for existing user by email
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email }
    });
    if (existingUser) {
        throw new Error("User with this email already exists");
    }
    // Check for existing user by phone (if provided)
    if (payload.phone) {
        const existingPhone = await prisma.user.findUnique({
            where: { phone: payload.phone }
        });
        if (existingPhone) {
            throw new Error("User with this phone already exists");
        }
    }
    const hashPassword = await bcrypt.hash(payload.password, 8);
    
    // Extract profileImage URL from multer (set by Cloudinary middleware)
    const profileImage = payload.profileImage || null;
    
    const result = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashPassword,
            phone: payload.phone || null,
            address: payload.address || null,
            profileImage: profileImage,
            role: payload.role || "CUSTOMER"
        }
    });
    const { password, ...rest } = result;
    return rest;
};
const loginUserIntoDB = async (payload: any) => {

    const user = await prisma.user.findUnique({
        where: {
            email: payload.email        
        }
    });
    if (!user) {
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }
    const { password, ...rest } = user;
    const token = jwt.sign(rest, getJwtSecret(), { expiresIn: "1d" });
    return { ...rest, token };
};

const googleAuthIntoDB = async (payload: GoogleAuthPayload) => {
    const email = payload.email?.trim().toLowerCase();
    const uid = payload.uid?.trim();
    const idToken = payload.idToken?.trim() || payload.credential?.trim() || payload.token?.trim();

    if (!email || !idToken) {
        throw new Error("email and idToken are required");
    }

    let verifiedIdentity: VerifiedGoogleIdentity;
    try {
        verifiedIdentity = await verifyGoogleIdentityToken(idToken);
    } catch (error) {
        throw new Error("Invalid Google token");
    }

    if (verifiedIdentity.email !== email) {
        throw new Error("Invalid Google token");
    }

    if (uid && verifiedIdentity.uid !== uid) {
        throw new Error("Invalid Google token");
    }

    if (!verifiedIdentity.emailVerified) {
        throw new Error("Google email is not verified");
    }

    let user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        const safeRole = payload.role === "SELLER" ? "SELLER" : "CUSTOMER";

        // Keep password non-null for existing schema while preventing local password login.
        const socialPassword = crypto.randomBytes(32).toString("hex");
        const hashedSocialPassword = await bcrypt.hash(socialPassword, 8);

        user = await prisma.user.create({
            data: {
                email,
                name: payload.name?.trim() || "Google User",
                profileImage: payload.profileImage || null,
                role: safeRole,
                status: "UNBAN",
                password: hashedSocialPassword,
            },
        });
    } else {
        if (user.status === "BAN") {
            throw new Error("Account is banned");
        }

        const shouldUpdateName = payload.name && payload.name.trim() && payload.name.trim() !== user.name;
        const shouldUpdateImage = typeof payload.profileImage === "string" && payload.profileImage !== user.profileImage;

        if (shouldUpdateName || shouldUpdateImage) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ...(shouldUpdateName ? { name: payload.name!.trim() } : {}),
                    ...(shouldUpdateImage ? { profileImage: payload.profileImage } : {}),
                },
            });
        }
    }

    const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
    };

    const token = jwt.sign(tokenPayload, getJwtSecret(), {
        expiresIn: "7d",
    });

    return {
        token,
    };
};

const getMeFromDB = async (token: string) => {
    if (!token) {
        throw new Error("Unauthorized");
    }

    let decoded: any;
    try {
        decoded = jwt.verify(token, getJwtSecret());
    } catch (error) {
        throw new Error("Invalid token");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.id
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            profileImage: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const AuthService = {
  createUserIntoDB,
    loginUserIntoDB,
        googleAuthIntoDB,
    getMeFromDB
};
