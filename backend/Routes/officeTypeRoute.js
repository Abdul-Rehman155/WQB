const express=require('express');
const router=express.Router();
const OfficeType=require('../Model/officeTypeSchema');

router.get('/', async (req,res)=>{
    try{
        const types=await OfficeType.find().sort({name:1});
        res.json(types);
    }catch(err){
        res.status(500).json({message:"Office Type Not Found",err});
    }
});

router.post('/',async (req,res)=>{
    const officeType= new OfficeType({name: req.body.name});
    try{
        const newType= await officeType.save();
        res.status(201).json(newType);
    }catch(err){
        res.status(400).json({message:"Office Type Not Added",err});
    }
});

router.delete('/:id',async (req,res)=>{
    try{
        await OfficeType.findByIdAndDelete(req.params.id);
        res.json({message:"Office Type Delete Successfully"});
    }
    catch(eer){
        res.status(500).json({message:"Office Type Not Deleted", err});
    }
});

module.exports=router;