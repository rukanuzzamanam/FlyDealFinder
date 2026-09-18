-- Seeds the destinations table from the same list as src/lib/destinations.ts.
-- Keep these two in sync when adding/removing destinations (see README.md
-- "How to add destinations").

insert into destinations (id, city, country, airport_code, airport_name, region, emoji, active) values
  ('mel', 'Melbourne', 'Australia', 'MEL', 'Melbourne Airport', 'Australia', '🏙️', true),
  ('bne', 'Brisbane', 'Australia', 'BNE', 'Brisbane Airport', 'Australia', '🌇', true),
  ('ool', 'Gold Coast', 'Australia', 'OOL', 'Gold Coast Airport', 'Australia', '🏖️', true),
  ('cns', 'Cairns', 'Australia', 'CNS', 'Cairns Airport', 'Australia', '🐠', true),
  ('per', 'Perth', 'Australia', 'PER', 'Perth Airport', 'Australia', '🌅', true),
  ('ade', 'Adelaide', 'Australia', 'ADL', 'Adelaide Airport', 'Australia', '🍷', true),
  ('hba', 'Hobart', 'Australia', 'HBA', 'Hobart Airport', 'Australia', '🏔️', true),

  ('dps', 'Bali', 'Indonesia', 'DPS', 'Ngurah Rai International Airport', 'Asia', '🌴', true),
  ('cgk', 'Jakarta', 'Indonesia', 'CGK', 'Soekarno–Hatta International Airport', 'Asia', '🏙️', true),
  ('bkk', 'Bangkok', 'Thailand', 'BKK', 'Suvarnabhumi Airport', 'Asia', '🛕', true),
  ('hkt', 'Phuket', 'Thailand', 'HKT', 'Phuket International Airport', 'Asia', '🏝️', true),
  ('kul', 'Kuala Lumpur', 'Malaysia', 'KUL', 'Kuala Lumpur International Airport', 'Asia', '🕌', true),
  ('sin', 'Singapore', 'Singapore', 'SIN', 'Singapore Changi Airport', 'Asia', '🦁', true),
  ('mnl', 'Manila', 'Philippines', 'MNL', 'Ninoy Aquino International Airport', 'Asia', '🏝️', true),
  ('sgn', 'Ho Chi Minh City', 'Vietnam', 'SGN', 'Tan Son Nhat International Airport', 'Asia', '🛵', true),
  ('han', 'Hanoi', 'Vietnam', 'HAN', 'Noi Bai International Airport', 'Asia', '🏮', true),
  ('nrt', 'Tokyo', 'Japan', 'NRT', 'Narita International Airport', 'Asia', '🗼', true),
  ('kix', 'Osaka', 'Japan', 'KIX', 'Kansai International Airport', 'Asia', '🍥', true),
  ('icn', 'Seoul', 'South Korea', 'ICN', 'Incheon International Airport', 'Asia', '🏯', true),
  ('tpe', 'Taipei', 'Taiwan', 'TPE', 'Taiwan Taoyuan International Airport', 'Asia', '🥟', true),
  ('hkg', 'Hong Kong', 'Hong Kong', 'HKG', 'Hong Kong International Airport', 'Asia', '🌃', true),

  ('akl', 'Auckland', 'New Zealand', 'AKL', 'Auckland Airport', 'New Zealand', '⛵', true),
  ('chc', 'Christchurch', 'New Zealand', 'CHC', 'Christchurch Airport', 'New Zealand', '🏔️', true),
  ('zqn', 'Queenstown', 'New Zealand', 'ZQN', 'Queenstown Airport', 'New Zealand', '🏂', true),
  ('wlg', 'Wellington', 'New Zealand', 'WLG', 'Wellington Airport', 'New Zealand', '🌬️', true),

  ('dxb', 'Dubai', 'United Arab Emirates', 'DXB', 'Dubai International Airport', 'Middle East', '🕌', true),
  ('doh', 'Doha', 'Qatar', 'DOH', 'Hamad International Airport', 'Middle East', '🏜️', true),
  ('auh', 'Abu Dhabi', 'United Arab Emirates', 'AUH', 'Zayed International Airport', 'Middle East', '🏙️', true),

  ('lon', 'London', 'United Kingdom', 'LON', 'London (all airports)', 'Europe', '🇬🇧', true),
  ('par', 'Paris', 'France', 'PAR', 'Paris (all airports)', 'Europe', '🗼', true),
  ('rom', 'Rome', 'Italy', 'ROM', 'Rome (all airports)', 'Europe', '🏛️', true),
  ('ams', 'Amsterdam', 'Netherlands', 'AMS', 'Amsterdam Airport Schiphol', 'Europe', '🌷', true),
  ('fra', 'Frankfurt', 'Germany', 'FRA', 'Frankfurt Airport', 'Europe', '🍺', true),
  ('ist', 'Istanbul', 'Turkey', 'IST', 'Istanbul Airport', 'Europe', '🕌', true),

  ('lax', 'Los Angeles', 'United States', 'LAX', 'Los Angeles International Airport', 'North America', '🌴', true),
  ('sfo', 'San Francisco', 'United States', 'SFO', 'San Francisco International Airport', 'North America', '🌉', true),
  ('nyc', 'New York', 'United States', 'NYC', 'New York (all airports)', 'North America', '🗽', true),
  ('yvr', 'Vancouver', 'Canada', 'YVR', 'Vancouver International Airport', 'North America', '🍁', true),
  ('hnl', 'Honolulu', 'United States', 'HNL', 'Daniel K. Inouye International Airport', 'North America', '🌺', true)
on conflict (id) do update set
  city = excluded.city,
  country = excluded.country,
  airport_code = excluded.airport_code,
  airport_name = excluded.airport_name,
  region = excluded.region,
  emoji = excluded.emoji,
  active = excluded.active;
