// jslinter esversion 6

// Require modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// Initialize express app
const app = express();

// Set the view engine
app.set('view engine', 'ejs');

// Set the bodyParser
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to the Database
mongoose.connect("mongodb+srv://admin-chinmai:test123@cluster0-9pguz.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

// Create schema for items in the list
const itemsSchema = {
  name: String
};

// Create model for the itemsSchema
const Item = mongoose.model("item", itemsSchema);

// Default document-1
const item1 = new Item({
  name: "Welcome to your todolist!"
});

// Default document-2
const item2 = new Item({
  name: "Hit + button to add a new item."
});

// Default document-3
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// insert Default documents into defaultItems array
const defaultItems = [item1, item2, item3]

// Create Schema for various type of lists(work, home, etc)
const listSchema = {
  name: String,
  items: [itemsSchema]
}

// Create modelfor the listSchema
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted defaultItems into database");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today",newListItems: foundItems});
    }

  });

});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/")
  }else{
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully Deleted");
      }res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}},{useFinAndModify: false} ,function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }


});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
