const express=require("express")
const app=express()

app.use(express.json())
app.use(express.urlencoded({
    extended: true
  }));
app.set("view engine","ejs");
app.use(express.static("public"));
const PORT=process.env.PORT || 3000

const mongoose=require("mongoose")
mongoose.connect("mongodb+srv://admin-pranav:TestPassword@cluster0.y912n0q.mongodb.net/ToDoListDB")

const itemSchema=new mongoose.Schema({name:String})
const listSchema=new mongoose.Schema({
    name:String, items: [itemSchema]
})

let Item=mongoose.model("ToDo",itemSchema)
let List=mongoose.model("customToDo",listSchema)

const defaultItems=[{name:"Welcome to ToDo list!"},
                {name:"Hit + button to add a new item"},
                {name:"<--Hit this to delete an item"}]

async function addDefault(){
    try{await Item.insertMany(defaultItems)}
    catch{console.log("Error!")}
}

async function emptyCollection(){
    try{await Item.deleteMany({})}
    catch{console.log("Error!")}
}

app.get("/",async function(req,res){
    Item.find({}).then((myitems)=>{
        if(myitems.length==0){ 
            addDefault()
            res.redirect("/")
        }
        else
        res.render("list",{listTitle:"Today", newListItem:myitems});
    }).catch((error)=>{
        console.log("Failed to retrieve items",error)
    })
})
app.get("/:customListName", async function(req,res){
    let customName=req.params.customListName
    let result=await List.findOne({name:customName})
    if(result==null){
        let data=new List({
            name: req.params.customListName,
            items: defaultItems
        })
        await data.save()
        res.redirect("/"+customName)
    }
    else{
        res.render("list",{listTitle:result.name, newListItem:result.items})
    }
})
app.post("/",async function(req,res){
    const itemName=req.body.newItem
    let data= new Item({name:itemName})
    if(req.body.list=="Today"){
        await data.save()
        res.redirect("/")
    }
    else{
        let result=await List.findOne({name:req.body.list})
        result.items.push(data);
        result.save();
        res.redirect("/"+req.body.list)
    }
})
app.post("/delete", async function(req,res){
    if(req.body.list=="Today"){
        await Item.deleteOne({_id:req.body.checkbox})
        res.redirect("/")
    }
    else{
        await List.findOneAndUpdate({name:req.body.list},{$pull:{items: {_id:req.body.checkbox}}})
        res.redirect("/"+req.body.list)
    }
})

app.listen(PORT,()=>{
    console.log("Listening on port "+PORT)
})

module.exports=app