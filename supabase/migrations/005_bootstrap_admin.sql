-- Bootstrap admin employee from existing auth user
INSERT INTO employees (id, full_name, campus, role)
SELECT id, 'Giancarlo Vargas', ARRAY['Barranquitas','Vega Alta'], 'admin'
FROM auth.users
WHERE email = 'giancarlovf2000@gmail.com'
ON CONFLICT (id) DO NOTHING;
