import * as sqlite3 from 'sqlite3';

let express = require('express');
let server = express();
let body_parser = require('body-parser');
server.use(body_parser.urlencoded({
    extended: true
}));
let db = new sqlite3.Database('sql/data.db');
server.set('view engine', 'pug');

function to_sql_date(date: Date): string {
    return date.toISOString().replace("T", " ").replace(/\.[0-9]{3}Z/g, "");
}
function updated_elo(elo, opponent_elo, result) {
    let expected = 1/(1+10 ** ((opponent_elo - elo)/400))
    return parseInt(elo + 32*(result - expected));
}
server.post('/upload_chess_game', function(req, res) {
    let white = req.body.player1;
    let black = req.body.player2
    let result = req.body.result;
    let date = to_sql_date(new Date());
    db.run("INSERT INTO ChessGame VALUES (?, ?, ?, ?);",[white, black, result, date], (err) => {
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
    let insert_arr = req.body.runner;
    insert_arr.push(to_sql_date(new Date()));
    if(insert_arr.length == 5) {
        db.run("INSERT INTO Run VALUES (?, ?, ?, ?, ?);",insert_arr, (err) => {
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
    let sql = 'SELECT name, chess_elo FROM Player WHERE chess_elo IS NOT NULL ORDER BY chess_elo DESC LIMIT 10;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let i = 1;
        for(let {name, chess_elo} of rows) {
            leaderboard.push({
                pos: i++,
                name: name,
                elo: chess_elo
            });
        }
        res.render('chess_leaderboard', {
            rows: leaderboard
        });
    });
});
server.get('/run_leaderboard', function(req, res) {
    let leaderboard = []
    let sql = 'SELECT first, second, third, player_id FROM PlayerRunScore WHERE overall!=0 ORDER BY overall DESC LIMIT 10;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let i = 1;
        for(let {first, second, third, player_id} of rows) {
            leaderboard.push({
                pos: i++,
                name: player_id,
                first: first,
                second: second,
                third: third
            });
        }
        res.render('run_leaderboard', {
            rows: leaderboard
        });
    });
});
server.get('/recent_runs', function(req, res) {
    let sql = 'SELECT first_id, second_id, third_id, forth_id, game_date FROM Run ORDER BY game_date DESC LIMIT 10;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        
        res.render('recent_runs', {
            rows: rows
        });
    });
});
server.get('/recent_chess', function(req, res) {
    let games = []
    let sql = 'SELECT white_id, black_id, result, game_date FROM ChessGame ORDER BY game_date DESC LIMIT 10;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);

        for(let i = 0; i < rows.length; i++)
                rows[i].result = {0: "White Victory", 0.5: "Draw", 1: "Black Victory"}[rows[i].result];

        res.render('recent_chess', {
            rows: rows
        });
    });
});
server.get('/profile', function(req, res) {
    let name = req.query.id;
    let data = {
        player: {},
        chess: [],
        runs: []
    };
    if(name == undefined) res.render('chess');
    else {
        let sql = "SELECT name, chess_elo, overall, first, second, third, forth FROM Player JOIN PlayerRunScore ON name = ? AND player_id = name ;";
        db.all(sql, [name], (err, rows) => {
            if(err) throw (err);

            if(!rows.length) res.render('chess');
            else {
                data.player = rows[0];

                sql = 'SELECT white_id, black_id, result, game_date FROM ChessGame WHERE white_id=? OR black_id=? ORDER BY game_date DESC LIMIT 10;';
                db.all(sql, [name, name], (err, rows) => {
                    if(err) throw (err);
                    data.chess = rows;

                    sql = 'SELECT first_id, second_id, third_id, forth_id, game_date FROM Run WHERE ' +
                        'first_id=? ' +
                        'OR second_id=? ' +
                        'OR third_id=? ' +
                        'OR forth_id=? ' +
                        'ORDER BY game_date DESC LIMIT 10;';
                    db.all(sql, [name,name,name,name], (err, rows) => {
                        if(err) throw (err);
                        for(let i = 0; i < rows.length; i++) {
                            rows[i].first_css = rows[i].first_id === name ? "font-weight: bold":"";
                            rows[i].second_css = rows[i].second_id === name ? "font-weight: bold":"";
                            rows[i].third_css = rows[i].third_id === name ? "font-weight: bold":"";
                            rows[i].forth_css = rows[i].forth_id === name ? "font-weight: bold":"";
                        }
                        console.log(data);
                        data.runs = rows;
                        res.render('profile', {
                            data: data
                        });
                    });
                });
            }
        });
    }

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
