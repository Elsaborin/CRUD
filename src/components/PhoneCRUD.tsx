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

  useEffect(() => {
    fetchPhones()
  }, [])

  const fetchPhones = async () => {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching phones:', error)
    } else {
      setPhones(data || [])
    }
  }

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length <= 10) {
      setInputValue(numericValue)
      setError('')
    }
  }

  const handleEditChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length <= 10) {
      setEditValue(numericValue)
      setError('')
    }
  }

  const handleAdd = async () => {
    if (inputValue.length !== 10) {
      setError('El número debe tener exactamente 10 dígitos')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('phone_numbers')
      .insert([{ phone: inputValue }])

    if (error) {
      if (error.message.includes('duplicate')) {
        setError('Este número ya está registrado')
      } else {
        setError('Error al agregar el número')
      }
    } else {
      setInputValue('')
      setError('')
      fetchPhones()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting phone:', error)
    } else {
      fetchPhones()
    }
  }

  const startEdit = (phone: PhoneRecord) => {
    setEditingId(phone.id)
    setEditValue(phone.phone)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
    setError('')
  }

  const handleUpdate = async (id: string) => {
    if (editValue.length !== 10) {
      setError('El número debe tener exactamente 10 dígitos')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('phone_numbers')
      .update({ phone: editValue })
      .eq('id', id)

    if (error) {
      if (error.message.includes('duplicate')) {
        setError('Este número ya está registrado')
      } else {
        setError('Error al actualizar el número')
      }
    } else {
      setEditingId(null)
      setEditValue('')
      setError('')
      fetchPhones()
    }
    setLoading(false)
  }

  return (
    <div className="phone-crud">
      <div className="header">
        <h1>Registro de Teléfonos</h1>
        <p className="restriction">
          No se aceptan: letras ni símbolos como &lt; &gt; ( ) = &apos; " \ / ; { } @ # $ % & * ! ? + _ . ,
        </p>
        <p className="subtitle">
          Solo números (10 dígitos exactos)
        </p>
      </div>

      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Escribe un número de teléfono..."
          className="phone-input"
          disabled={loading}
        />
        <button
          onClick={handleAdd}
          disabled={loading || inputValue.length !== 10}
          className="add-button"
        >
          Agregar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="phone-table">
          <thead>
            <tr>
              <th>#</th>
              <th>TELÉFONO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {phones.map((phone, index) => (
              <tr key={phone.id}>
                <td>{index + 1}</td>
                <td>
                  {editingId === phone.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditChange(e.target.value)}
                      className="edit-input"
                      disabled={loading}
                    />
                  ) : (
                    phone.phone
                  )}
                </td>
                <td>
                  <div className="actions">
                    {editingId === phone.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(phone.id)}
                          disabled={loading || editValue.length !== 10}
                          className="action-btn save-btn"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="action-btn cancel-btn"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(phone)}
                          className="action-btn edit-btn"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(phone.id)}
                          className="action-btn delete-btn"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {phones.length === 0 && (
          <div className="empty-state">No hay números registrados</div>
        )}
      </div>
    </div>
  )
}
