-- ============================================================
-- Hilos del Alma · base de datos del panel
--
-- Ejecutar UNA VEZ en el proyecto de Supabase de Hilos del Alma:
-- Dashboard -> SQL Editor -> New query -> pegar todo -> Run.
-- Después: crear el usuario en Authentication -> Users y correr
-- "supabase-crear-admin.sql" con el ID de ese usuario.
-- ============================================================

-- 1. Perfiles: quién puede entrar al panel.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  nombre text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Cada usuario ve su propio perfil"
  on public.profiles for select to authenticated using (id = auth.uid());

create or replace function public.get_my_role()
returns text language sql security definer set search_path = public stable
as $$ select role from public.profiles where id = auth.uid(); $$;

-- 2. Categorías (editables desde el panel).
create table public.categorias (
  id text primary key,
  nombre text not null,
  texto text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categorias enable row level security;
create policy "Cualquiera ve las categorias"
  on public.categorias for select to anon, authenticated using (true);
create policy "Admin administra categorias"
  on public.categorias for all to authenticated
  using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

-- 3. Piezas.
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria_id text references public.categorias(id) on delete set null on update cascade,
  linea text check (linea in ('fe','amor','personalizados')),
  descripcion text,
  significado text,
  precio bigint,
  visible boolean not null default true,
  agotado boolean not null default false,
  destacado boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.productos enable row level security;
create policy "Publico ve las piezas visibles"
  on public.productos for select to anon using (visible);
create policy "Admin administra piezas"
  on public.productos for all to authenticated
  using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

create table public.producto_fotos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  url text not null,
  posicion int not null default 0
);
alter table public.producto_fotos enable row level security;
create policy "Publico ve fotos de piezas visibles"
  on public.producto_fotos for select to anon
  using (exists (select 1 from public.productos p where p.id = producto_id and p.visible));
create policy "Admin administra fotos de piezas"
  on public.producto_fotos for all to authenticated
  using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

-- 4. Medallas y su significado (se muestran en Inicio y Nosotras).
create table public.medallas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  significado text,
  foto text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.medallas enable row level security;
create policy "Cualquiera ve las medallas"
  on public.medallas for select to anon, authenticated using (true);
create policy "Admin administra medallas"
  on public.medallas for all to authenticated
  using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

-- 5. Fotos: buckets públicos para ver, solo el admin sube y borra.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true), ('medallas', 'medallas', true)
on conflict (id) do nothing;

create policy "Lectura publica de fotos"
  on storage.objects for select to public
  using (bucket_id in ('productos','medallas'));
create policy "Admin sube fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('productos','medallas') and get_my_role() = 'admin');
create policy "Admin actualiza fotos"
  on storage.objects for update to authenticated
  using (bucket_id in ('productos','medallas') and get_my_role() = 'admin');
create policy "Admin borra fotos"
  on storage.objects for delete to authenticated
  using (bucket_id in ('productos','medallas') and get_my_role() = 'admin');

-- 6. Datos iniciales: las categorías que pidió la clienta y las 9 piezas
--    que ya estaban en el sitio (sus fotos viven en assets/img/).
insert into public.categorias (id, nombre, texto, orden) values
  ('pulseras', 'Pulseras', 'Para cada día, para cada intención.', 1),
  ('manillas', 'Manillas', 'Con diferentes nombres y significados.', 2),
  ('collares', 'Collares', 'Perlas, medallas y nombres que te acompañan.', 3),
  ('charms', 'Charms para bolsos y llaveros', 'Un detalle de fe que viaja contigo.', 4),
  ('straps', 'Straps para celular', 'Protección y cariño en tu día a día.', 5),
  ('hogar', 'Bendiciones para el hogar', 'Para que la paz habite tu casa.', 6),
  ('carro', 'Bendiciones para el carro', 'Para cuidar cada camino.', 7),
  ('rosarios', 'Rosarios', 'Hechos a tu medida, con tus colores.', 8);

do $$
declare pid uuid;
begin
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Pulsera dorada con escapulario', 'pulseras', 'fe', 'Cuentas doradas y bronce con escapulario bordado en cristales. Ajustable.', true, 1) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/dorada.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Pulsera plateada con medalla', 'pulseras', 'fe', 'Cuentas plateadas y medalla con imagen sagrada rodeada de cristales.', true, 2) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/plateada.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Pulsera con escapulario azul', 'pulseras', 'fe', 'Cuentas azul grafito y doradas con escapulario enmarcado.', false, 3) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/azul.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Pulseras con tu palabra', 'pulseras', 'personalizados', 'FE, DIOS, PAZ o la palabra que elijas, en los colores que más te gusten.', true, 4) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/palabras.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Manillas con medallas', 'manillas', 'fe', 'Piedras rosadas y vino con medallas de la Virgen. Se combinan entre sí.', false, 5) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/muneca.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Manilla de perlas', 'manillas', 'amor', 'Varias vueltas de perlas finas con perlas barrocas en las puntas.', true, 6) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/perlas.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Collar de perlas', 'collares', 'amor', 'Perlas pequeñas con detalles dorados. Delicado y elegante.', true, 7) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/collar.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Llavero Virgen con cuentas rojas', 'charms', 'fe', 'Medalla con la Virgen rodeada de cuentas rojas, corazón y dije dorado.', true, 8) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/llavero-rojo.webp', 0);
  insert into public.productos (nombre, categoria_id, linea, descripcion, destacado, orden)
    values ('Llavero rosado con cruz', 'charms', 'fe', 'Cristales rosados, medalla de la Virgen y borla tejida con cruz.', false, 9) returning id into pid;
  insert into public.producto_fotos (producto_id, url, posicion) values (pid, 'assets/img/llavero-rosa.webp', 0);
end $$;
