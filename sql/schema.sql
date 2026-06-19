CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id BIGINT;

DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_id_fkey;

  ALTER TABLE users
  ADD CONSTRAINT users_department_id_fkey
  FOREIGN KEY (department_id)
  REFERENCES departments(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

  ALTER TABLE users
  ADD CONSTRAINT users_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
END;
$$;

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(120) NOT NULL,
  file_size BIGINT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  uploaded_by BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_visible_users (
  document_id BIGINT NOT NULL REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, user_id)
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_status VARCHAR(30) NOT NULL DEFAULT 'Creación';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_user_id BIGINT;

UPDATE documents
SET document_date = created_at::date
WHERE document_date IS NULL;

DO $$
BEGIN
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_department_id_fkey;
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_company_id_fkey;
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_owner_user_id_fkey;
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_status_check;

  ALTER TABLE documents
  ADD CONSTRAINT documents_document_status_check
  CHECK (document_status IN ('Vigente', 'Revisión', 'Creación', 'Desactualizado', 'Obsoleto'));

  ALTER TABLE documents
  ADD CONSTRAINT documents_department_id_fkey
  FOREIGN KEY (department_id)
  REFERENCES departments(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

  ALTER TABLE documents
  ADD CONSTRAINT documents_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

  ALTER TABLE documents
  ADD CONSTRAINT documents_owner_user_id_fkey
  FOREIGN KEY (owner_user_id)
  REFERENCES users(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
END;
$$;

CREATE TABLE IF NOT EXISTS "session" (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON "session" (expire);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users (department_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users (company_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments (is_active);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies (is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories (is_active);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents (category_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_owner_user_id ON documents (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_department_id ON documents (department_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents (company_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_date ON documents (document_date);
CREATE INDEX IF NOT EXISTS idx_documents_document_status ON documents (document_status);
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents (title);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON documents (is_active);
CREATE INDEX IF NOT EXISTS idx_document_visible_users_user_id ON document_visible_users (user_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_departments_updated_at ON departments;
CREATE TRIGGER set_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_companies_updated_at ON companies;
CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_documents_updated_at ON documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO categories (name, description)
VALUES
  ('Contratos', 'Documentos legales y contractuales.'),
  ('Finanzas', 'Comprobantes, reportes y archivos contables.'),
  ('Recursos Humanos', 'Expedientes, formatos y documentos internos.'),
  ('Operaciones', 'Procedimientos y documentacion operativa.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name, description)
VALUES
  ('Administracion', 'Equipo administrativo y gestion interna.'),
  ('Finanzas', 'Equipo financiero y contable.'),
  ('Recursos Humanos', 'Gestion de personal y expedientes.'),
  ('Operaciones', 'Equipo operativo.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO companies (name, description)
VALUES
  ('Operadora Palermo', 'Empresa principal.'),
  ('Corporativo', 'Servicios corporativos.'),
  ('Sucursal Norte', 'Unidad operativa norte.'),
  ('Sucursal Sur', 'Unidad operativa sur.')
ON CONFLICT (name) DO NOTHING;
