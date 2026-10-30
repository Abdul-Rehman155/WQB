const express=require('express');
const router=express.Router();
const employeeType=require('../Model/employeeType');

router.get('/',async (req, res)=>{
    try{
        const types=await employeeType.find().sort({name:1});
        res.json(types);
    } catch(err){
        res.status(500).json({meaasge:"employee category not found"});
    }
});

router.post('/', async (req,res)=>{
    const type = new employeeType({
        name:req.body.name
    });
    try{
        const newType= await type.save();
        res.status(201).json(newType);
    }catch(err){
        res.status(400).json({message:"Category create error",err});
    }
});
router.put('/:id', async (req,res)=>{
    try{
        const updateType= await employeeType.findByIdAndUpdate(
            req.params.id,
            {name:req.body.name},
            {new:true},
        );
        if(!updateType)
            return res.status(404).json({message:"Type Not Found"});
        res.json(updateType);
    }catch(err){
        res.status(400).json({message:"update Error",err});
    }
});
router.delete('/:id', async (req,res)=>{
    try{
        const type=await employeeType.findByIdAndUpdate(req.params.id);
        if(!type) return res.status(404).json({message:"Employee Type Delete Successfully"});
    }catch(err){
        res.status(500).json({message:"Delete Error Found",err});
    }
});

module.exports=router