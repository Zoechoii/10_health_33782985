-- test data
USE health;

-- gold user (password: smiths)
INSERT INTO users (username, email, password_hash, salt) 
VALUES (
    'gold',
    'gold@example.com',
    '$2b$10$thV0.3xj/sY6pCzu/mUEuOAhB01OOSPgBAnj4bCMDdjykMfxA9eFq',
    '2f0014bb41d60c24b977922943da9535'
)
ON DUPLICATE KEY UPDATE username=username;

SET @gold_user_id = (SELECT id FROM users WHERE username = 'gold');

-- clear old data
DELETE FROM weight_records WHERE user_id = @gold_user_id;
DELETE FROM goals WHERE user_id = @gold_user_id;
DELETE FROM supplements WHERE user_id = @gold_user_id;

-- weight records
INSERT INTO weight_records (user_id, weight, record_date) 
VALUES 
    (@gold_user_id, 70.5, '2025-01-15'),
    (@gold_user_id, 71.0, '2025-01-22'),
    (@gold_user_id, 70.8, '2025-01-29'),
    (@gold_user_id, 71.2, '2025-02-05');

-- goal
INSERT INTO goals (user_id, target_weight, target_date) 
VALUES (@gold_user_id, 68.0, '2026-06-01');

-- supplements
INSERT INTO supplements (user_id, supplement_name, dosage, frequency, notes) 
VALUES 
    (@gold_user_id, 'Vitamin D', '1000 IU', 'Daily', 'Take with breakfast'),
    (@gold_user_id, 'Omega-3', '1000mg', 'Daily', 'Take with dinner'),
    (@gold_user_id, 'Multivitamin', '1 tablet', 'Daily', 'Morning');

