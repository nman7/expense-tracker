USE expense_tracker;

INSERT INTO categories (name, color) VALUES
  ('Food & Dining', '#f97316'),
  ('Transport', '#3b82f6'),
  ('Shopping', '#a855f7'),
  ('Health', '#22c55e'),
  ('Entertainment', '#ec4899'),
  ('Utilities', '#eab308'),
  ('Other', '#6b7280');

INSERT INTO expenses (title, category_id, amount, date, description) VALUES
  ('Grocery run', 1, 85.40, '2026-03-01', 'Weekly groceries from Coles'),
  ('Bus card top-up', 2, 30.00, '2026-03-03', NULL),
  ('Netflix subscription', 5, 18.99, '2026-03-05', 'Monthly plan'),
  ('Electricity bill', 6, 142.50, '2026-03-08', 'March electricity'),
  ('Lunch at work', 1, 14.50, '2026-03-10', 'Thai place near office'),
  ('Gym membership', 4, 49.95, '2026-03-12', 'Monthly gym fee'),
  ('New headphones', 3, 79.00, '2026-03-15', 'JB Hi-Fi'),
  ('Uber to airport', 2, 38.20, '2026-03-18', NULL),
  ('Pharmacy', 4, 22.10, '2026-03-20', 'Cold medicine'),
  ('Dinner out', 1, 63.00, '2026-03-25', 'Birthday dinner');
