import { type Request, type Response } from "express";
import { AuthService } from "../services/auth.service.js";



export const registerUser = async (req:Request, res:Response) =>{

    try {
        const user = await AuthService.registerUser(req.body)
        res.status(201).json({msg:"User created", data: user})

    } catch (error:any) {

        const message  = error.code === 'P2002' ? 'Email already exist' : 'Registration failed'
        res.status(400).json({msg:error})
        
    }
}

export const loginUser = async (req:Request, res:Response)=> {

    try {
        
        const {email, password} = req.body
        const result = await AuthService.validateUser(email,password)
        res.status(201).json({msg: "Login successful",data:result})


    } catch (error:any) {
        res.status(401).json({ error: error.message })
    }



}