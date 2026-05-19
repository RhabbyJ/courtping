insert into public.app_users (id, auth_user_id, email, phone, plan_tier)
values
  ('00000000-0000-0000-0000-000000000101', null, 'demo@courtping.local', '+15550101010', 'free')
on conflict (id) do nothing;

insert into public.venues (
  id,
  name,
  slug,
  address,
  city,
  neighborhood,
  latitude,
  longitude,
  sports,
  number_of_courts,
  indoor_outdoor,
  lights,
  public_private,
  booking_url,
  source_url,
  live_status,
  source_platform,
  notes
)
values
  ('00000000-0000-0000-0000-000000000201', 'Griffith Riverside Courts', 'griffith-riverside-courts', '3401 Riverside Dr, Los Angeles, CA', 'Los Angeles', 'Los Feliz', 34.1181, -118.2707, array['tennis', 'pickleball'], 3, 'outdoor', true, 'public', 'https://example.com/griffith-riverside-booking', 'TODO: verify official facility source URL', 'live_alerts', 'manual', 'Seeded MVP facility with mock live-alert coverage.'),
  ('00000000-0000-0000-0000-000000000202', 'Santa Monica Ocean View Tennis Center', 'santa-monica-ocean-view-tennis-center', '2600 Barnard Way, Santa Monica, CA', 'Santa Monica', 'Ocean Park', 34.0006, -118.4837, array['tennis'], 2, 'outdoor', true, 'public', 'https://example.com/santa-monica-tennis-booking', 'TODO: verify official facility source URL', 'manual_beta', 'unknown', 'Directory listing only until source platform is verified.'),
  ('00000000-0000-0000-0000-000000000203', 'Culver City Paddle & Pickleball', 'culver-city-paddle-pickleball', '4117 Overland Ave, Culver City, CA', 'Culver City', 'Downtown Culver', 34.0122, -118.3951, array['pickleball'], 2, 'outdoor', true, 'public', 'https://example.com/culver-pickleball-booking', 'TODO: verify official facility source URL', 'booking_link_only', 'unknown', 'Booking link directory entry; automated monitoring is not active.'),
  ('00000000-0000-0000-0000-000000000204', 'Cheviot Hills Recreation Center', 'cheviot-hills-recreation-center', '2551 Motor Ave, Los Angeles, CA', 'Los Angeles', 'Rancho Park', 34.0447, -118.4094, array['tennis', 'pickleball'], 8, 'outdoor', true, 'public', 'https://example.com/cheviot-hills-booking', 'TODO: verify official facility source URL', 'manual_beta', 'webtrac', 'Likely public recreation booking flow; source platform requires verification.'),
  ('00000000-0000-0000-0000-000000000205', 'Westwood Recreation Center', 'westwood-recreation-center', '1350 S Sepulveda Blvd, Los Angeles, CA', 'Los Angeles', 'Westwood', 34.0555, -118.4432, array['pickleball'], 4, 'outdoor', false, 'public', 'https://example.com/westwood-rec-booking', 'TODO: verify official facility source URL', 'coming_soon', 'unknown', 'Candidate facility for monitoring requests.'),
  ('00000000-0000-0000-0000-000000000206', 'Poinsettia Recreation Center', 'poinsettia-recreation-center', '7341 Willoughby Ave, Los Angeles, CA', 'Los Angeles', 'Fairfax', 34.0877, -118.3493, array['tennis'], 4, 'outdoor', true, 'public', 'https://example.com/poinsettia-rec-booking', 'TODO: verify official facility source URL', 'booking_link_only', 'webtrac', 'Directory listing with placeholder booking/source URLs.'),
  ('00000000-0000-0000-0000-000000000207', 'Mar Vista Recreation Center', 'mar-vista-recreation-center', '11430 Woodbine St, Los Angeles, CA', 'Los Angeles', 'Mar Vista', 34.0079, -118.4285, array['tennis', 'pickleball'], 6, 'outdoor', true, 'public', 'https://example.com/mar-vista-rec-booking', 'TODO: verify official facility source URL', 'manual_beta', 'webtrac', 'Good candidate for live alert adapter validation.'),
  ('00000000-0000-0000-0000-000000000208', 'Van Nuys Sherman Oaks Recreation Center', 'van-nuys-sherman-oaks-recreation-center', '14201 Huston St, Sherman Oaks, CA', 'Los Angeles', 'Sherman Oaks', 34.1595, -118.4426, array['tennis'], 8, 'outdoor', true, 'public', 'https://example.com/van-nuys-sherman-oaks-booking', 'TODO: verify official facility source URL', 'coming_soon', 'unknown', 'Directory listing pending booking platform verification.'),
  ('00000000-0000-0000-0000-000000000209', 'Memorial Park Tennis Courts', 'memorial-park-tennis-courts', '1401 Olympic Blvd, Santa Monica, CA', 'Santa Monica', 'Mid-City', 34.0214, -118.4815, array['tennis', 'pickleball'], 6, 'outdoor', true, 'public', 'https://example.com/memorial-park-booking', 'TODO: verify official facility source URL', 'booking_link_only', 'civicrec', 'Source platform label is a working hypothesis and not verified.'),
  ('00000000-0000-0000-0000-000000000210', 'El Segundo Recreation Park Courts', 'el-segundo-recreation-park-courts', '401 Sheldon St, El Segundo, CA', 'El Segundo', 'Recreation Park', 33.9181, -118.4117, array['tennis', 'pickleball'], 8, 'outdoor', true, 'public', 'https://example.com/el-segundo-rec-park-booking', 'TODO: verify official facility source URL', 'coming_soon', 'unknown', 'South Bay candidate for future adapter coverage.')
on conflict (id) do nothing;

insert into public.courts (id, venue_id, name, sport, surface, indoor, active)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Tennis Court 1', 'tennis', 'hard', false, true),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 'Tennis Court 2', 'tennis', 'hard', false, true),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', 'Pickleball Court A', 'pickleball', 'hard', false, true),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000202', 'Ocean Tennis Court 1', 'tennis', 'hard', false, true),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000202', 'Ocean Tennis Court 2', 'tennis', 'hard', false, true),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000203', 'Pickleball Court 1', 'pickleball', 'acrylic', false, true),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000203', 'Pickleball Court 2', 'pickleball', 'acrylic', false, true)
on conflict (id) do nothing;

insert into public.subscriptions (id, user_id, plan_tier, status)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', 'free', 'active')
on conflict (id) do nothing;
