DROP TABLE Player;
DROP TABLE PlayerRunScore;
DROP TABLE ChessGame;
DROP TABLE Run;

CREATE TABLE Player (
	name VARCHAR2(40) PRIMARY KEY,
	chess_elo NUMBER(4)
);

CREATE TABLE PlayerRunScore (
	overall NUMBER(4) NOT NULL,
	first NUMBER(4) NOT NULL,
	second NUMBER(4) NOT NULL,
	third NUMBER(4) NOT NULL,
	forth NUMBER(4) NOT NULL,
	player_id VARCHAR2(40) NOT NULL UNIQUE REFERENCES Player
);

CREATE TABLE ChessGame (
	white_id VARCHAR2(40) NOT NULL REFERENCES Player,
	black_id VARCHAR2(40) NOT NULL REFERENCES Player,
	result NUMBER(4) NOT NULL
);

CREATE TABLE Run (
	first_id VARCHAR2(40) NOT NULL REFERENCES Player,
	second_id VARCHAR2(40) NOT NULL REFERENCES Player,
	third_id VARCHAR2(40) NOT NULL REFERENCES Player,
	forth_id VARCHAR2(40) NOT NULL REFERENCES Player
);

CREATE TRIGGER after_insert_player
AFTER INSERT ON Player
BEGIN
INSERT INTO PlayerRunScore VALUES (0, 0, 0, 0, 0, NEW.name);
END;

CREATE TRIGGER IF NOT EXISTS before_insert_run
BEFORE INSERT ON Run
BEGIN
	INSERT OR IGNORE INTO Player VALUES (NEW.first_id, NULL);
    INSERT OR IGNORE INTO Player VALUES (NEW.second_id, NULL);
    INSERT OR IGNORE INTO Player VALUES (NEW.third_id, NULL);
    INSERT OR IGNORE INTO Player VALUES (NEW.forth_id, NULL);

    UPDATE PlayerRunScore SET overall = overall + 5, first = first + 1 WHERE player_id = NEW.first_id;
    UPDATE PlayerRunScore SET overall = overall + 3, second = second + 1 WHERE player_id = NEW.second_id;
    UPDATE PlayerRunScore SET overall = overall + 1, third = third + 1 WHERE player_id = NEW.third_id;
    UPDATE PlayerRunScore SET forth = forth + 1 WHERE player_id = NEW.forth_id;
END;


CREATE TRIGGER IF NOT EXISTS before_insert_chess_game
BEFORE INSERT ON ChessGame
BEGIN
        INSERT OR IGNORE INTO Player VALUES (NEW.white_id, 1500);
        INSERT OR IGNORE INTO Player VALUES (NEW.black_id, 1500);
        UPDATE Player SET chess_elo=1500 WHERE chess_elo IS NULL AND (name=NEW.white_id OR name=new.black_id);
        UPDATE Player SET chess_elo
END;




