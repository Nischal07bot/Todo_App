const express=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cors = require("cors");
const { z }=require("zod");
const JWT_SECRET="ashu123";
const {UserModel,TodoModel}=require("./db");
const { default: mongoose } = require('mongoose');
const app=express();
app.use(cors());
app.use(express.json());
mongoose.connect("mongodb+srv://singhnischal953:week70637@week7.btmk4.mongodb.net/todo-app-database")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB Connection Error:", err));

app.post("/signup",async function(req,res){
    const requiredbody=z.object({
        email: z.string().min(3).max(100).email(),
        name:z.string().min(3).max(100),
        password:z.string().min(3).max(100)
    })
    //const parseddata=requiredbody.parse(req.body);
    const parseddatasafe=requiredbody.safeParse(req.body);
    if(!parseddatasafe.success)
    {
        return res.status(400).json({ 
            message: "Validation failed", 
            errors: parseddatasafe.error.errors  // Extract error details
        });
    }
    const email=req.body.email;
    const password=req.body.password;
    const name=req.body.name;
    let errorthrown=false;
    try{
    const hashedpass=await bcrypt.hash(password,5);
    console.log(hashedpass);

    await UserModel.create({//async thereby an await
        email:email,
        password:hashedpass,
        name:name
    })
}catch(e)
{
    errorthrown=true;
    res.json({
        message:"User already exists"
    })
}
    if(!errorthrown)
    {
    res.json({
        message:"You are signed up"
    })
}
});
app.post("/signin",async function(req,res){
    const email=req.body.email;
    const password=req.body.password;
    const user=await UserModel.findOne({
        email:email
    })
    if(!user)
    {
        res.status(403).json({
            message:"Incorrect user"
        })
        return;
    }
    const passmatch=await bcrypt.compare(password,user.password);
    console.log(user);
    if(passmatch){
             const token=jwt.sign({
                id:user._id.toString()
             },JWT_SECRET);
             res.json({
                token:token
             });
    }
    else{
        res.status(403).json({
            message:"Incorrect Credentials"
        })
    }
});
function auth(req,res,next){
    const token=req.headers.token;
    const decodeddata=jwt.verify(token,JWT_SECRET);
    if(decodeddata)
    {
        req.userId=decodeddata.id;
        next();
    }
    else{
        res.status(403).json({
            message:"Incorrect credentials"
        })
    }
};
app.post("/todo",auth,async function(req,res){
    const userId=req.userId;
    console.log(userId);
    const title=req.body.tittle;
    const done=req.body.done;
    await TodoModel.create({
        userId,
        title,
        done
    })
    res.json({
        message:"Your Todo is created"
    })
});
app.get("/todos",auth,async function(req,res){
    const userId=req.userId;
    const todos=await TodoModel.find({
        userId
    })
    res.json({
        todos
    })
});
app.delete("/todo/:id", auth, async function (req, res) {
    try {
        const todoId = req.params.id;
        const userId = req.userId; // Extract userId from auth middleware
        
        const todo = await TodoModel.findOneAndDelete({ _id: todoId, userId });
        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        res.json({ message: "Todo removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.listen(3000);