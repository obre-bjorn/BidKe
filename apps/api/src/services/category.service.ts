import { db } from "@auction/db";



export class CategoryService {

    static async createCategory(data : {name:string, description?:string}){

        return await db.category.create({
            data:{
                name:data.name,
                description: data.description
            }
        })

    }

    static async getAllCategories(){

        return await db.category.findMany();

    }

    static async getCategoryById(id:string){

        return await db.category.findUnique({where:{id}, include:{auctions:true}})

    }

    static async updateCategory(id:string, data : {name?:string, description?:string}){

        return await db.category.update({
            where:{id},
            data:{
                name:data.name,
                description: data.description
            }
        })

    }

    static async deleteCategory(id:string){

        return await db.category.delete({where:{id}})

    }

}