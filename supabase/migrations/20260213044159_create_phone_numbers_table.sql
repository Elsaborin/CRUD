-- 1. Preparar la estructura para seguridad por usuario
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- 2. Limpieza total de políticas inseguras anteriores
DROP POLICY IF EXISTS "Anyone can read phone numbers" ON phone_numbers;
DROP POLICY IF EXISTS "Anyone can insert phone numbers" ON phone_numbers;
DROP POLICY IF EXISTS "Anyone can update phone numbers" ON phone_numbers;
DROP POLICY IF EXISTS "Anyone can delete phone numbers" ON phone_numbers;
DROP POLICY IF EXISTS "Anonimos solo pueden insertar" ON phone_numbers;

-- 3. Políticas de Seguridad a Nivel de Fila (RLS) definitivas
-- Solo el dueño puede ver sus números (Evita el volcado/dumping que hizo el profe)
CREATE POLICY "Users can only see their own numbers"
  ON phone_numbers FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propios números
CREATE POLICY "Users can insert their own numbers"
  ON phone_numbers FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Solo el dueño puede editar sus números
CREATE POLICY "Users can update their own numbers"
  ON phone_numbers FOR UPDATE
  USING (auth.uid() = user_id);

-- Solo el dueño puede borrar sus números (Protección contra borrado masivo ajeno)
CREATE POLICY "Users can delete their own numbers"
  ON phone_numbers FOR DELETE
  USING (auth.uid() = user_id);

-- 4. FUNCIÓN DE SEGURIDAD AVANZADA: Limitar a 10 números por usuario
-- Esto evita que alguien inyecte 1000 números y sature tu base de datos
CREATE OR REPLACE FUNCTION check_number_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM phone_numbers WHERE user_id = auth.uid()) >= 10 THEN
    RAISE EXCEPTION 'Has alcanzado el límite máximo de 10 números permitidos.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_number_limit
BEFORE INSERT ON phone_numbers
FOR EACH ROW EXECUTE FUNCTION check_number_limit();