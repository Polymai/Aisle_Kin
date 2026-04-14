insert into app612_aislekin_starter_lists (title, emoji, position)
select title, emoji, position
from (
  values
    ('Weekly Run', '🛒', 0),
    ('Top-Up Tonight', '🥬', 1)
) as seed(title, emoji, position)
where not exists (
  select 1 from app612_aislekin_starter_lists
);

insert into app612_aislekin_starter_items (
  starter_list_id,
  name,
  quantity,
  unit,
  notes,
  section,
  priority,
  sort_order,
  library_kind
)
select
  l.id,
  seed.name,
  seed.quantity,
  seed.unit,
  seed.notes,
  seed.section,
  seed.priority,
  seed.sort_order,
  seed.library_kind
from app612_aislekin_starter_lists l
join (
  values
    ('Weekly Run', 'Milk', 2, 'cartons', 'Whole or oat, whichever is running low', 'Dairy', 1, 0, 'favorite'),
    ('Weekly Run', 'Eggs', 1, 'dozen', 'Large eggs', 'Dairy', 1, 1, 'staple'),
    ('Weekly Run', 'Bananas', 6, null, 'A few green, a few ripe', 'Produce', 2, 2, 'staple'),
    ('Weekly Run', 'Spinach', 1, 'bag', null, 'Produce', 2, 3, null),
    ('Weekly Run', 'Greek yogurt', 1, 'tub', null, 'Dairy', 2, 4, 'favorite'),
    ('Weekly Run', 'Chicken thighs', 2, 'packs', null, 'Meat & Seafood', 2, 5, null),
    ('Weekly Run', 'Rice', 1, 'bag', 'Jasmine if available', 'Pantry', 3, 6, 'staple'),
    ('Weekly Run', 'Dish soap', 1, 'bottle', null, 'Household', 3, 7, null),
    ('Top-Up Tonight', 'Limes', 4, null, null, 'Produce', 2, 0, null),
    ('Top-Up Tonight', 'Cilantro', 1, 'bunch', null, 'Produce', 2, 1, null),
    ('Top-Up Tonight', 'Tortillas', 1, 'pack', null, 'Bakery', 2, 2, 'favorite'),
    ('Top-Up Tonight', 'Cheddar', 1, 'block', null, 'Deli', 2, 3, null),
    ('Top-Up Tonight', 'Sparkling water', 1, 'case', null, 'Beverages', 3, 4, 'staple')
) as seed(list_title, name, quantity, unit, notes, section, priority, sort_order, library_kind)
  on seed.list_title = l.title
where not exists (
  select 1 from app612_aislekin_starter_items
);