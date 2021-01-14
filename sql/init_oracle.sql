DROP TABLE Player CASCADE CONSTRAINTS;
DROP TABLE PlayerRunScore CASCADE CONSTRAINTS;
DROP TABLE ChessGame CASCADE CONSTRAINTS;
DROP TABLE Run CASCADE CONSTRAINTS;

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

CREATE OR REPLACE TRIGGER after_insert_player
AFTER INSERT ON Player
FOR EACH ROW BEGIN
    INSERT INTO PlayerRunScore VALUES (0, 0, 0, 0, 0, :NEW.name);
END;
/

CREATE OR REPLACE TRIGGER before_insert_run
BEFORE INSERT ON Run
FOR EACH ROW BEGIN
    DECLARE
    first_p_id NUMBER(4);
    second_p_id NUMBER(4);
    third_p_id NUMBER(4);
    forth_p_id NUMBER(4);
    BEGIN
        SELECT COUNT(*) INTO first_p_id FROM Player WHERE name=:NEW.first_id;
        SELECT COUNT(*) INTO second_p_id FROM Player WHERE name=:NEW.second_id;
        SELECT COUNT(*) INTO third_p_id FROM Player WHERE name=:NEW.third_id;
        SELECT COUNT(*) INTO forth_p_id FROM Player WHERE name=:NEW.forth_id;

        IF(first_p_id = 0) THEN INSERT INTO Player VALUES (:NEW.first_id, NULL); END IF;
        IF(second_p_id = 0) THEN INSERT INTO Player VALUES (:NEW.second_id, NULL); END IF;
        IF(third_p_id = 0) THEN INSERT INTO Player VALUES (:NEW.third_id, NULL); END IF;
        IF(forth_p_id = 0) THEN INSERT INTO Player VALUES (:NEW.forth_id, NULL); END IF;
    END;
    UPDATE PlayerRunScore SET overall = overall + 5, first = first + 1 WHERE player_id = :NEW.first_id;
    UPDATE PlayerRunScore SET overall = overall + 3, second = second + 1 WHERE player_id = :NEW.second_id;
    UPDATE PlayerRunScore SET overall = overall + 1, third = third + 1 WHERE player_id = :NEW.third_id;
    UPDATE PlayerRunScore SET forth = forth + 1 WHERE player_id = :NEW.forth_id;
END;
/

CREATE OR REPLACE TRIGGER before_insert_chess_game
BEFORE INSERT ON ChessGame
FOR EACH ROW BEGIN
    DECLARE
    white_cnt NUMBER(4);
    black_cnt NUMBER(4);
    white_elo NUMBER(4);
    black_elo NUMBER(4);

    BEGIN
        SELECT COUNT(*) INTO white_cnt FROM Player WHERE name=:NEW.white_id;
        SELECT COUNT(*) INTO black_cnt FROM Player WHERE name=:NEW.black_id;
        SELECT chess_elo INTO white_elo FROM Player WHERE name=:NEW.white_id;
        SELECT chess_elo INTO black_elo FROM Player WHERE name=:NEW.black_id;


        IF(white_cnt = 0) THEN
            INSERT INTO Player VALUES (:NEW.white_id, 1500);
        ELSIF white_elo IS NULL THEN
            UPDATE Player SET chess_elo = 1500 WHERE name=:NEW.white_id;
        END IF;

        IF(black_cnt = 0) THEN
            INSERT INTO Player VALUES (:NEW.black_id, 1500);
        ELSIF black_elo IS NULL THEN
            UPDATE Player SET chess_elo = 1500 WHERE name=:NEW.black_id;
        END IF;
    END;

END;
/



