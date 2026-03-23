'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [children, setChildren] = useState([
    { name: '', age: '', interest: '', otherInterest: '' }
  ])

  const handleChildChange = (index: number, field: string, value: string) => {
    const updated = [...children]
    updated[index][field] = value
    setChildren(updated)
  }

  const addChild = () => {
    setChildren([
      ...children,
      { name: '', age: '', interest: '', otherInterest: '' }
    ])
  }

  const handleSubmit = async () => {
    const { data: parent } = await supabase
      .from('parents')
      .insert([{ name: parentName, email }])
      .select()
      .single()

    const childrenData = children.map(c => ({
      parent_id: parent.id,
      name: c.name,
      age: c.age,
      interests: c.interest === 'others' ? c.otherInterest : c.interest
    }))

    await supabase.from('children').insert(childrenData)

    alert('Saved!')
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4">

        <h1 className="text-2xl font-bold text-center">The Kiddle 🧸</h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="Parent Name"
          value={parentName}
          onChange={e => setParentName(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <div className="space-y-4">
          {children.map((child, i) => (
            <div key={i} className="border p-3 rounded space-y-2">

              <input
                className="w-full border p-2 rounded"
                placeholder="Child Name"
                value={child.name}
                onChange={e => handleChildChange(i, 'name', e.target.value)}
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Age"
                value={child.age}
                onChange={e => handleChildChange(i, 'age', e.target.value)}
              />

              <select
                className="w-full border p-2 rounded"
                value={child.interest}
                onChange={e => handleChildChange(i, 'interest', e.target.value)}
              >
                <option value="">Select Interest</option>
                <option value="animals">Animals</option>
                <option value="space">Space</option>
                <option value="stories">Stories</option>
                <option value="science">Science</option>
                <option value="others">Others</option>
              </select>

              {child.interest === 'others' && (
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Enter custom interest"
                  value={child.otherInterest}
                  onChange={e =>
                    handleChildChange(i, 'otherInterest', e.target.value)
                  }
                />
              )}

            </div>
          ))}
        </div>

        <button
          onClick={addChild}
          className="w-full bg-gray-200 p-2 rounded"
        >
          + Add Child
        </button>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Submit
        </button>

      </div>
    </div>
  )
}