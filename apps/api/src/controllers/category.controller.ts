import {type Response, type Request} from "express";
import { CategoryService } from "../services/category.service.js";



export async function createCategory(req:Request, res:Response){

    try {
        const category = await CategoryService.createCategory(req.body)
        res.status(201).json({msg:"Category created", data: category})

    } catch (error:any) {
        res.status(400).json({msg:error.message})
    }

}

export async function getAllCategories(req:Request, res:Response){
    
    try {
        const categories = await CategoryService.getAllCategories()
        res.status(200).json({data: categories})
    } catch (error:any) {
        res.status(400).json({msg:error.message})
    }

}

export async function getCategoryById(req:Request, res:Response){

    try {
        const category = await CategoryService.getCategoryById(req.params.id as string)
        if(!category){
            return res.status(404).json({msg:"Category not found"})
        }
        res.status(200).json({data: category})
    } catch (error:any) {
        res.status(400).json({msg:error.message})
    }

}

export async function updateCategory(req:Request, res:Response){

    try {
        const category = await CategoryService.updateCategory(req.params.id as string, req.body)
        res.status(200).json({msg:"Category updated", data: category})
    } catch (error:any) {
        res.status(400).json({msg:error.message})
    }

}

export async function deleteCategory(req:Request, res:Response){

    try {
        await CategoryService.deleteCategory(req.params.id)
        res.status(200).json({msg:"Category deleted"})
    } catch (error:any) {
        res.status(400).json({msg:error.message})
    }

}       
