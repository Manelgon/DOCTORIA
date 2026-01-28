-- PROYECTO DOCTORIA - SCHEMA COMPLETO PARA SUPABASE (V2 - CON CARTERAS)

-- 1. Perfiles de usuario (Extensión de auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('medico', 'paciente', 'admin')) NOT NULL,
    nombre TEXT,
    apellidos TEXT,
    cif TEXT,
    telefono TEXT,
    direccion TEXT,
    avatar_url TEXT,
    especialidad TEXT,
    numero_colegiado TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Carteras (Portfolios de Pacientes)
-- Un médico puede tener varias carteras, y una cartera puede ser compartida.
CREATE TABLE carteras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- El médico que la creó
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Acceso compartido a Carteras
-- Permite que un médico comparta su cartera con otros (ej. una clínica compartida)
CREATE TABLE carteras_acceso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartera_id UUID NOT NULL REFERENCES carteras(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permiso TEXT CHECK (permiso IN ('leer', 'escribir', 'admin')) DEFAULT 'leer',
    UNIQUE (cartera_id, medico_id)
);

-- 4. Pacientes (Ahora vinculados a una cartera)
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartera_id UUID NOT NULL REFERENCES carteras(id) ON DELETE CASCADE,
    medico_creador_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Quién lo dio de alta
    full_name TEXT NOT NULL,
    dni TEXT NOT NULL,
    birth_date DATE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Consultas Médicas
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    diagnosis TEXT,
    treatment TEXT
);

-- 6. Recetas (Integrada con API REMPe)
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    medicamento VARCHAR(255) NOT NULL,
    dosis VARCHAR(100),
    indicaciones TEXT,
    duracion VARCHAR(100),
    firmado BOOLEAN DEFAULT FALSE,
    archivo_pdf TEXT,
    rempe_id VARCHAR(100),
    estado_rempe VARCHAR(50),
    url_rempe TEXT,
    codigo_verificacion VARCHAR(100),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Pruebas médicas
CREATE TABLE pruebas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    tipo VARCHAR(100) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Resultados de pruebas
CREATE TABLE resultados_pruebas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prueba_id UUID NOT NULL REFERENCES pruebas(id) ON DELETE CASCADE,
    descripcion TEXT,
    archivo_resultado TEXT,
    fecha_resultado TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Documentos Legales Base
CREATE TABLE documentos_legales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    contenido TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Firmas de documentos
CREATE TABLE firmas_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    documento_id UUID NOT NULL REFERENCES documentos_legales(id) ON DELETE CASCADE,
    firmado BOOLEAN DEFAULT FALSE,
    fecha_firma TIMESTAMP WITH TIME ZONE,
    archivo_pdf TEXT
);

-- 11. Citas (Agenda)
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    modalidad VARCHAR(50) DEFAULT 'Presencial',
    motivo TEXT,
    estado VARCHAR(20) DEFAULT 'Programada'
);

-- 12. Mensajería Interna
CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emisor_id UUID NOT NULL,
    receptor_id UUID NOT NULL,
    emisor_tipo TEXT CHECK (emisor_tipo IN ('DOCTOR', 'PACIENTE', 'ADMIN')) NOT NULL,
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Auditoría
CREATE TABLE logs_acceso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    usuario_tipo TEXT CHECK (usuario_tipo IN ('DOCTOR', 'PACIENTE', 'ADMIN')) NOT NULL,
    accion TEXT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONFIGURACIÓN DE SEGURIDAD (Row Level Security - RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteras ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteras_acceso ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pruebas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_pruebas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_legales ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmas_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO PARA PERFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS DE ACCESO PARA CARTERAS
-- Un médico ve las carteras que posee o a las que tiene acceso
CREATE POLICY "Medicos ven sus carteras propias" ON carteras FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Medicos ven carteras compartidas" ON carteras FOR SELECT USING (id IN (SELECT cartera_id FROM carteras_acceso WHERE medico_id = auth.uid()));

-- POLÍTICAS PARA PACIENTES
-- Un médico ve pacientes de carteras a las que tiene acceso
CREATE POLICY "Acceso a pacientes via carteras" ON pacientes FOR ALL 
USING (
    cartera_id IN (SELECT id FROM carteras WHERE owner_id = auth.uid()) OR
    cartera_id IN (SELECT cartera_id FROM carteras_acceso WHERE medico_id = auth.uid())
);

-- Un paciente solo ve sus propios datos (comparando su ID de perfil con su ID de autenticación)
CREATE POLICY "Pacientes ven su ficha" ON pacientes FOR SELECT 
USING (id = auth.uid());

-- FUNCIÓN AUXILIAR ELIMINADA - No recomendada por Supabase para evitar bucles.
-- Se prefiere usar (auth.jwt() -> 'user_metadata' ->> 'role')

-- ADMIN POLICIES (Super Access)
-- Usamos el JWT para verificar el rol de admin sin consultar la tabla 'profiles' recursivamente
CREATE POLICY "Admin full access on profiles" ON profiles FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin full access on carteras" ON carteras FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin full access on pacientes" ON pacientes FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin full access on consultas" ON consultas FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin full access on recetas" ON recetas FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 12. CONFIGURACIÓN DE STORAGE (Buckets)
-- Creamos el bucket para avatares si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatar_profesionales', 'avatar_profesionales', true)
ON CONFLICT (id) DO NOTHING;

-- POLÍTICAS PARA EL BUCKET DE AVATARES
-- Lectura pública para cualquier usuario (ya que el bucket es public:true)
CREATE POLICY "Avatares son públicos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatar_profesionales');

-- Solo los Admins pueden subir o borrar fotos en este bucket
CREATE POLICY "Admins gestionan avatares" ON storage.objects FOR ALL TO authenticated 
USING (
    bucket_id = 'avatar_profesionales' AND 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
