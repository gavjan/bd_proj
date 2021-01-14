import * as sqlite3 from 'sqlite3';

let express = require('express');
let server = express();
let body_parser = require('body-parser');
server.use(body_parser.urlencoded({
    extended: true
}));
let db = new sqlite3.Database('sql/data.db');
server.set('view engine', 'pug');


function updated_elo(elo, opponent_elo, result) {
    let expected = 1/(1+10 ** ((opponent_elo - elo)/400))
    return elo + 32*(result - expected);
}
server.post('/upload_chess_game', function(req, res) {
    let white = req.body.player1;
    let black = req.body.player2
    let result = req.body.result;
    db.run("INSERT INTO ChessGame VALUES (?, ?, ?);",[white, black, result], (err) => {
        if(err) throw(err);
        let sql = 'SELECT name, chess_elo FROM Player WHERE name = ? OR name = ?;';
        db.all(sql, [white, black], (err, rows) => {
            if(err) throw (err);
            let white_elo, black_elo;
            for(let {name, chess_elo} of rows) {
                if(name === white)  white_elo = chess_elo;
                else                black_elo = chess_elo;
            }
            white_elo = updated_elo(white_elo, black_elo, 1 - result);
            black_elo = updated_elo(black_elo, black_elo, result);
            db.run("UPDATE Player SET chess_elo=? WHERE name=?;",[white_elo, white], () =>
            db.run("UPDATE Player SET chess_elo=? WHERE name=?;",[black_elo, black], () =>
                res.render('chess')
            ));
        });

    });
});
server.post('/upload_run', function(req, res) {
    let pos_arr = req.body.runner;
    if(pos_arr.length == 4) {
        db.run("INSERT INTO Run VALUES (?, ?, ?, ?);",pos_arr, (err) => {
            if(err) throw(err);
            res.render('run');
        });
    } else res.render('run');
});
server.get('/new_chess_game', function(req, res) {
    res.render('new_chess');
});
server.get('/new_run', function(req, res) {
    res.render('new_run');
});
server.get('/chess_leaderboard', function(req, res) {
    let leaderboard = []
    let sql = 'SELECT name, chess_elo FROM Player WHERE chess_elo IS NOT NULL ORDER BY chess_elo DESC;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let i = 1;
        for(let {name, chess_elo} of rows) {
            leaderboard.push({
                pos: i,
                name: name,
                elo: chess_elo
            });
            i++;
            if(i > 10) break;
        }
        res.render('chess_leaderboard', {
            rows: leaderboard
        });
    });
});
server.get('/run_leaderboard', function(req, res) {
    let leaderboard = []
    let sql = 'SELECT first, second, third, player_id FROM PlayerRunScore ORDER BY overall DESC;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let i = 1;
        for(let {first, second, third, player_id} of rows) {
            leaderboard.push({
                pos: i,
                name: player_id,
                first: first,
                second: second,
                third: third
            });
            i++;
            if(i > 10) break;
        }
        res.render('run_leaderboard', {
            rows: leaderboard
        });
    });
});
server.get('/run', function(req, res) {
    res.render('run');
});
server.get('/chess', function(req, res) {
    res.render('chess');
});
server.get('/', function(req, res) {
    res.render('chess');
});

server.listen(8000);
console.log("Listening on localhost:8000");
