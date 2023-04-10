const express = require('express');
const fs = require("fs")


function check_user(username){
   var users = fs.readFileSync('geojson.json', 'utf8');
	users = JSON.parse(users)
   
	for (var i in users.features) {
      if (users.features[i].properties.message == username){
         return true;
      }else{
         return false;
      }
	} 
}



function add_user(username, lng, lat) {
   console.log("add_user function")
   
	index = fs.readFileSync("index.txt", {encoding:"utf-8"})
   
	var users = fs.readFileSync(`games/game${parseInt(index)}.json`, 'utf8');
   //users = JSON.parse(JSON.stringify(users))
	users = JSON.parse(users)
   console.log("USERS: ")
   console.log(users)
	var new_user = {
      "type": "Feature",
      "properties": {
         "message": username,
         "iconSize": [40, 40]
      },
      "geometry": {
         "type": "Point",
         "coordinates": [lng, lat]
      }
	}
   
	var count = 0;
	for (var i in users.features) {
      if (users.features.hasOwnProperty(i)) count++;
	}
   console.log(count)

   
	for (var i = 0; i < count; i++) {
      if (users.features[i].properties.username != username) {
         users.features.push(new_user)
         console.log(users.features)
			fs.writeFile(`games/game${parseInt(index)}.json`, JSON.stringify(users), (err) => {
            if (err) throw err;
			})
			console.log("added new user")
         break;
		}
		dont_add = false
		break;
	}
}


function update_geojson(username, lng, lat){
   console.log("updated")
   feature = {
      "type": "Feature",
      "properties": {
         "message": username,
         "iconSize": [40, 40]
      },
      "geometry": {
         "type": "Point",
         "coordinates": [lng, lat]
      }
   }
   console.log(feature)

   
   var users = fs.readFileSync('geojson.json', 'utf8');
	users = JSON.parse(users)
   
	var count = 0;
	for (var i in users.features) {
      if (users.features.hasOwnProperty(i)) count++;
	}
   
	for (var i = 0; i < count; i++) {
      if (users.features[i].properties.message == username) {
         users.features[i].geometry.coordinates = [lng, lat]
         
			fs.writeFile("geojson.json", JSON.stringify(users), (err) => {
            if (err) throw err;
			})
			
			break;
		}else {
         console.log("not in list")
         add_user(username, lng, lat)
      }
	}
   
}

user_base = {
   "type":"Feature",
   "properties":{
      "username":"",
      "ip": 0,
      "iconSize":[40,40]
   },
   "geometry":{
      "type":"Point",
      "coordinates":[0, 0]
   }
}

game_boilerpalte = {
   "type":"FeatureCollection",
   "features":[
      
   ],
   "game_settings": {
       "time": 0,
       "loc_reveal": 0,
       "zone_size": 0,
       "zone_shrink": 0,
       "game_name": 0,
       "game_code": 0,
       "starter_ip": 0
      }
   }
   
   
   
   

const app = express();
const PORT = 3000;
const bodyParser = require("body-parser")
const cors = require("cors");

app.use(express.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static("public"))
app.use(bodyParser.json())
app.use(cors())

app.get("/", (req, res) => {
   res.send("<h1>Working!</h1>")
})


function find_game(game_code) {
   index = fs.readFileSync("index.txt", {encoding:"utf-8"})
   for (i = 0; i <= index; i++) {
      try{
         if (JSON.parse(fs.readFileSync(`games/game${parseInt(i)+1}.json`, "utf-8", (err) => {
            if (err) {console.log(err)}
         })).game_settings.game_code == game_code) {
            return parseInt(i)+1;
         }
      }catch{
         console.log("NO FILE FOUND OR JSON INVALID")
      }
   }
   return -1;
}



app.post("/join_game/", (req, res) => {
   // add new user to game file with the right game code
   console.log("joined Game")
	game_code = req.body.game_code

   
   if(find_game(game_code) < 0) {
      res.status(200).send("No game with that code found")
      console.log("no game found")
   }else {
      console.log("game found")      
      find_game(game_code)
      user_base.properties.username = req.body.username
      user_base.geometry.coordinates[1] = req.body.lng
      user_base.geometry.coordinates[0] = req.body.lat
      user_base.properties.ip = req.body.ip

      console.log("user_ip: ", user_base.properties.ip)

      game = fs.readFileSync(`games/game${parseInt(find_game(game_code))}.json`, {encoding: "utf-8"})
      game = JSON.parse(game)
      game.features.push(user_base)

      console.log(req.body)

      fs.writeFileSync(`games/game${parseInt(find_game(game_code))}.json`, JSON.stringify(game))
      res.status(200).send("Joined game")
   }
})



app.post("/get_user", (req, res) => {
   //get ip
   console.log("get_user")
   ip = req.body.ip
   console.log(ip)
   index = fs.readFileSync("index.txt", {encoding:"utf-8"})

   for (i = 1; i <= index; i++) {
      game_data = fs.readFileSync(`games/game${parseInt(i)}.json`, "utf-8", (err) => {
         if (err) {console.log(err)}
      })
      game_data = JSON.parse(game_data)
      for (j = 0; j < game_data.features.length; j++) {
         console.log("---------------------------------")
         console.log("j: " + j)
         if(game_data.features[j].properties.ip == ip) {
            console.log("same ip as: " + game_data.features[j].properties.username)
            
            res.status(200).send(game_data.features[j])
            break;
         }
      }
      
   }
})

app.post("/new_game", (req, res) => {
   // create a gameX.json file to store all the locations and settings 
	// add boiler plate info (first user and the settings from the user)
   console.log("new game")
   time = req.body.time
   loc_reveal = req.body.loc_reveal
   zone_size = req.body.zone_size
   zone_shrink = req.body.zone_shrink
   game_name = req.body.game_name
   starter_ip = req.body.game_starter_ip
   new_game_code = Math.floor(Math.random() * 1000000)


	index = fs.readFileSync("index.txt", {encoding:"utf-8"})

	fs.open(`games/game${parseInt(index)+1}.json`, 'w', function (err, file) {
		if (err) {
			console.log(err)
		}else{
			fs.writeFileSync("index.txt", (parseInt(index) +1).toString(), (err) => {
				console.log(err)
         })
		
			game_boilerpalte.game_settings.time = time
			game_boilerpalte.game_settings.loc_reveal = loc_reveal
			game_boilerpalte.game_settings.zone_size = zone_size
			game_boilerpalte.game_settings.zone_shrink = zone_shrink
         game_boilerpalte.game_settings.game_name = game_name
         game_boilerpalte.game_settings.game_code = new_game_code
         game_boilerpalte.game_settings.starter_ip = starter_ip

			console.log(game_boilerpalte)
			fs.writeFile(`games/game${parseInt(index)+1}.json`, JSON.stringify(game_boilerpalte), (err) => {
            console.log(err)
         })
			console.log('Saved!');
	  
      }
   });

     res.status(200).send({game_code: new_game_code})

})

app.post("/start_game/:game_code/:ip", (req, res) => {
   console.log("started game")
   //console.log(req.params.game_code)

   //find game with same game code and start updating the positions and geojson 
})


app.post("/get_game_code/:ip", (req, res) => {
   index = fs.readFileSync("index.txt", {encoding:"utf-8"})

   game_data = fs.readFileSync(`games/game${parseInt(index)}.json`, "utf-8", (err) => {
      if (err) {console.log(err)}
   })
/*
   fs.writeFile(`games/game${parseInt(index)+1}.json`, "", (err) => {
      console.log(err)
   })
*/

   game_data = JSON.parse(game_data)

   console.log("ip: " + req.params.ip)
   starter_ip = game_data.game_settings.starter_ip
   console.log("starter ip: " + starter_ip)


   if (starter_ip == req.params.ip){
      res.status(200).send(JSON.stringify(game_data.game_settings.game_code))
   }else{
      console.log("NOT SAME :(")
      res.status(200).send(false)
   }
   
   //res.status(200).send("IT DID NOT WORK :(")
})


app.listen(process.env.PORT || PORT, () => {
	console.log("server started at port " + PORT)
})

