const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const Rutas = require("./models/Rutas");
const path = require('path');
const md = require('marked');

const app = express();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/notes', { useNewUrlParser: true, useUnifiedTopology: true  });

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));


async function analytics(req,res,next){
	const data = {
		userAgent: req.get("User-Agent"),
		path: req.path
	};
	const info = new Rutas(data);
	try {
		await info.save();
	} catch (e) {
		return next(e);
	}
	next();
}

app.get("/", analytics, async (req, res) => {
	const notes = await Note.find();
	res.render("index",{ notes: notes } )
});

app.get("/analytics", analytics, async (req, res) => {
	const rutasAnalytics = await Rutas.aggregate([
		{
			$group: {
				_id: {
					path: '$path'
				},
				count: {
					$sum: 1
				},
			}
		},{	
			$sort: {
				count:-1
			}
	}]).
	then(function(respuesta){
		res.render("analytics",{ rutaS: respuesta } )
	});
	
	
});


app.get("/notes/new", analytics, async (req, res) => {
	const notes = await Note.find();
	res.render("new", { notes: notes });
});

app.post("/notes", async (req, res, next) => {
	const data = {
		title: req.body.title,
		body: req.body.body
	};
	
	const note = new Note(req.body);
	try {
		await note.save();
	} catch (e) {
		return next(e);
	}
	
	res.redirect('/');
});

app.get("/notes/:id", analytics, async (req, res) => {
	const notes = await Note.find();
	const note = await Note.findById(req.params.id);
	res.render("show", { notes: notes, currentNote: note, md: md });
});

app.get("/notes/:id/edit", analytics, async (req, res, next) => {
	const notes = await Note.find();
	const note = await Note.findById(req.params.id);
	res.render("edit", { notes: notes, currentNote: note });
});

app.patch("/notes/:id", analytics, async (req, res) => {
	const id = req.params.id;
	const note = await Note.findById(id);
	
	note.title = req.body.title;
	note.body = req.body.body;
	
	try {
		await note.save();
	} catch (e) {
		return next(e);
	}
	
	res.status(204).send({});
});

app.delete("/notes/:id", async (req, res) => {
	await Note.deleteOne({ _id: req.params.id });
	res.status(204).send({});
});

app.listen(3000, () => console.log("Listening on port 3000 ..."));
