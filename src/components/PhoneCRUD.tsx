import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './PhoneCRUD.css'

export default function PhoneCRUD() {
  const [phones, setPhones] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Función para asegurar identidad antes de pedir datos
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await supabase.auth.signInAnonymously() // Crea la identidad segura
      }
      fetchPhones()
    }
    setupAuth()
  }, [])

  const fetchPhones = async () => {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setPhones(data || [])
  }

  const handleAdd = async () => {
    if (inputValue.length !== 10) {
      setError('Deben ser 10 dígitos exactos')
      return
    }

    setLoading(true)
    const { error: insertError } = await supabase
      .from('phone_numbers')
      .insert([{ phone: inputValue }]) // El user_id se asigna solo en la BD

    if (insertError) {
      setError(insertError.message.includes('duplicate') ? 'Ya registrado' : 'Error de seguridad')
    } else {
      setInputValue('')
      fetchPhones()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('phone_numbers').delete().eq('id', id)
    fetchPhones()
  }

  return (
    <div className="phone-crud">
      <h1>Registro Seguro</h1>
      <div className="input-section">
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10 dígitos..." 
        />
        <button onClick={handleAdd} disabled={loading}>Guardar</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <table>
        <thead><tr><th>Número</th><th>Acción</th></tr></thead>
        <tbody>
          {phones.map(p => (
            <tr key={p.id}>
              <td>{p.phone}</td>
              <td><button onClick={() => handleDelete(p.id)}>Eliminar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}