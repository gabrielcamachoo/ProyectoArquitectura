ALTER TABLE modules ADD CONSTRAINT modules_order_positive CHECK ("order" > 0);
ALTER TABLE evaluations ADD CONSTRAINT evaluations_weight_range CHECK (weight >= 0 AND weight <= 100);
ALTER TABLE progress ADD CONSTRAINT progress_percentage_range CHECK (percentage >= 0 AND percentage <= 100);
ALTER TABLE attempts ADD CONSTRAINT attempts_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100));
