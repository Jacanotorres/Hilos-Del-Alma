-- Da acceso al panel a la cuenta de la clienta.
-- 1) Supabase -> Authentication -> Users -> Add user (correo + contraseña, marcar "Auto Confirm User").
-- 2) Copia el "User UID" de ese usuario y pégalo abajo en lugar de 125a2deb-d851-4083-9e07-a1335f334c3c.
-- 3) Correr en el SQL Editor.

insert into public.profiles (id, role, nombre)
values ('125a2deb-d851-4083-9e07-a1335f334c3c', 'admin', 'Hilos del Alma')
on conflict (id) do update set role = excluded.role, nombre = excluded.nombre;
