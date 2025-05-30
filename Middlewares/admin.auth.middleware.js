



module.exports=(req,res,next)=>{
    console.log("The request user is ",req.user);
    if(!req.user || req.user.role!='admin'){
        return res.status(403).json({message:"Acess denied.Admins Only"})
    }
    next();
}