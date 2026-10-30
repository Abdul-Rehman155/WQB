const express=require('express');
const router=express.Router();
const Category = require("../Model/categoriesSchema");

router.get('/', async (req,res)=>{
    try{
        const categories= await Category.find().sort({name:1});
        res.status(200).json(categories);
    }
    catch(err){
        res.status(500).json({message:"server Error nott add category : ",err});
    }
});

router.post('/', async (req, res)=>{
    try{
        const {name}=req.body;
        if(!name) return res.status(400).json({message:"Name is required"});
        const newCategory=new Category({name});
        await newCategory.save();
        res.status(201).json(newCategory);
    }
    catch(err){
        if(err.code===11000){
            return res.status(400).json({message: "Category already exists"})
        }
        res.status(500).json({message:"Error savinf catogory "})
    }
});

router.delete('/:id',async (req,res)=>{
    try{
        const {id}=req.params;
        await Category.findByIdAndDelete(id);
        res.status(200).json({message:"deleted successfully"});

    }
    catch(err){
        res.status(500).json({message:"Error deleted category"});
    }
})
module.exports=router;