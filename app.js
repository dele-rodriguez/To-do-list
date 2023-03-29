//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to mongoDb
mongoose.connect("mongodb+srv://dele-rodriguez:dele2r0d@cluster0.p0vhcs6.mongodb.net/todolistDB");

// schema creation 
const itemSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

// collection creation 
const Item = mongoose.model("item" , itemSchema);

const List = mongoose.model("list" , listSchema);

// documents creation 
const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const workItems = [];

app.get("/", (req, res) => {
  const day = "Today";  
  Item.find()
    .then((foundItems) => {
      if (foundItems.length === 0) {
        // adding data to mongodb collections
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Documents have been saved!");
          })
          .catch((err) => {
            console.log(err);
        });
        res.redirect("/");
      } else { 
        // console.log(foundItems);
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
    })
    .catch((err) => {
      console.log(err);
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName );
      })
      .catch( (err) => {
        console.log(err);
    });
  }

});

app.post("/delete" , (req , res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "today") {
    Item.findByIdAndRemove(checkedItemId)
    .then (() => {
      console.log("deleted successfully!");
      res.redirect("/");
    })
    .catch( (err) => {
      console.log(err);
  });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}} )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
    });
  }
});

app.get("/:customListName" , (req , res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then((foundList) => {
    if (foundList) {
      if (foundList.name === customListName) {
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        console.log("error occured!");
      }
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }
  }) 
  .catch((err) => console.log(err));
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
