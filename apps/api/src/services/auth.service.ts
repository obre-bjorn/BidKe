import { Role } from "../../../../packages/db/generated/prisma/enums.js";
import { hashPassword, comparePasssword,generateToken } from "../lib/auth.js";
import { db } from "@auction/db";


export class AuthService {

    static async registerUser(data : {email:string, password:Buffer | string, username:string}){

        const hashedPassword = await hashPassword(data.password.toString())

        return await db.user.create({
            data: {
                email:data.email,
                password: hashedPassword,
                username: data.username,
                role: "USER"
            },
            select:{id:true, email:true, username:true, role:true }
        })

    }

    static async validateUser(email:string, pass: string){

        const user  = await db.user.findUnique({where:{email : email}})


        console.log("User found:", user);

        if(!user || !await comparePasssword(pass, user.password)){
            throw new Error("Invalid credentials")
        }

        const token = generateToken({id: user.id, role: user.role})


        return {
            token,
            user:{
                id:user.id,
                username: user.username,
                role:user.role
            }
        }

    }




}