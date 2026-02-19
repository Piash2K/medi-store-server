import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const createUser = async (req: Request, res: Response) => {
    try {
        const result = await AuthService.createUserIntoDB(req.body);
        res.status(200).json({
            success: true,
            message: 'User created successfully',
            data: result
        }); 
    } catch (error) {
        
    }
};


export const AuthController = {
    createUser
    };