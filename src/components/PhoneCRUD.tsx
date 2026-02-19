import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './PhoneCRUD.css'

interface PhoneRecord {
  id: string
  phone: string
  created_at: string
}

export default function PhoneCRUD() {
  const [phones, setPhones] = useState<PhoneRecord[]>([])
  const [inputValue, setInputValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // CAPA DE SEGURIDAD: Inicialización de identidad antes de cargar datos
  useEffect(() => {
    const initApp = async () => {
      // 1. Verificamos si ya hay una sesión (anónima o real)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 2. Si no hay sesión, creamos una anónima para que el RLS funcione
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
          setError('Error de conexión segura');
          return;
        }
      }
      // 3. Con la identidad asegurada, cargamos los teléfonos
      fetchPhones();
    };

    initApp();
  }, [])

  const fetchPhones = async () => {
    // Gracias al RLS, el '*' solo devuelve los números que pertenecen a TU usuario
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setPhones(data || [])
  }

  const handleAdd = async () => {
    if (inputValue.length !== 10) {
      setError('El número debe tener 10 dígitos')
      return
    }

    setLoading(true)
    setError('')

    // Insertamos el número; el user_id se asigna automáticamente en la DB
    const { error: insertError } = await supabase
      .from('phone_numbers')
      .insert([{ phone: inputValue }])

    if (insertError) {
      if (insertError.message.includes('límite máximo')) {
        setError('Seguridad: No puedes agregar más de 10 números.')
      } else if (insertError.message.includes('duplicate')) {
        setError('Este número ya existe.')
      } else {
        setError('Error de seguridad al guardar.')
      }
    } else {
      setInputValue('')
      fetchPhones()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    // La DB rechazará el borrado si el ID no te pertenece
    const { error } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('id', id)

    if (error) {
      setError('No tienes permiso para eliminar este registro.')
    } else {
      fetchPhones()
    }
  }

  const handleUpdate = async (id: string) => {
    if (editValue.length !== 10) return

    setLoading(true)
    const { error } = await supabase
      .from('phone_numbers')
      .update({ phone: editValue })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchPhones()
    } else {
      setError('Error al actualizar: Acceso denegado.')
    }
    setLoading(false)
  }

  // Validadores para mantener el diseño de entrada limpio
  const handleInputChange = (val: string) => setInputValue(val.replace(/\D/g, '').slice(0, 10))
  const handleEditChange = (val: string) => setEditValue(val.replace(/\D/g, '').slice(0, 10))

  return (
    <div className="phone-crud">
      <div className="header">
        <h1>Bóveda de Teléfonos</h1>
        <p className="restriction">Protegido con RLS e Identidad Única</p>
      </div>

      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Ej: 1234567890"
          className="phone-input"
          disabled={loading}
        />
        <button 
          onClick={handleAdd} 
          disabled={loading || inputValue.length !== 10} 
          className="add-button"
        >
          {loading ? 'Validando...' : 'Guardar Seguro'}
        </button>
      </div>

      {error && <div className="error-message" style={{ color: '#ff4d4d', fontWeight: 'bold', margin: '10px 0' }}>{error}</div>}

      <div className="table-container">
        <table className="phone-table">
          <thead>
            <tr><th>#</th><th>TELÉFONO</th><th>ACCIONES</th></tr>
          </thead>
          <tbody>
            {phones.map((phone, index) => (
              <tr key={phone.id}>
                <td>{index + 1}</td>
                <td>
                  {editingId === phone.id ? 
                    <input 
                      value={editValue} 
                      onChange={(e) => handleEditChange(e.target.value)} 
                      className="edit-input" 
                      autoFocus
                    /> : 
                    phone.phone
                  }
                </td>
                <td>
                  <div className="actions">
                    {editingId === phone.id ? (
                      <button onClick={() => handleUpdate(phone.id)} className="action-btn save-btn">OK</button>
                    ) : (
                      <>
                        <button 
                          onClick={() => {setEditingId(phone.id); setEditValue(phone.phone)}} 
                          className="action-btn edit-btn"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(phone.id)} 
                          className="action-btn delete-btn"
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}