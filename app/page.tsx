'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Child = {
  name: string
  age_value: string
  age_unit: string
  interest: string
  otherInterest: string
}

export default function Home() {
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [children, setChildren] = useState<Child[]>([
    { name: '', age_value: '', age_unit: 'years', interest: '', otherInterest: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const addChild = () => {
    setChildren([
      ...children,
      { name: '', age_value: '', age_unit: 'years', interest: '', otherInterest: '' }
    ])
  }

  const removeChild = (index: number) => {
    if (children.length === 1) return
    setChildren(children.filter((_, i) => i !== index))
  }

  const handleChildChange = (index: number, field: keyof Child, value: string) => {
    const updated = [...children]
    updated[index][field] = value
    setChildren(updated)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')

    try {
      if (!email.trim()) {
        setMessage('Email is required')
        return
      }

      // 1) Get or create parent
      let parentId: string

      const { data: existingParent, error: parentLookupError } = await supabase
        .from('parents')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle()

      if (parentLookupError) throw parentLookupError

      if (existingParent) {
        parentId = existingParent.id

        // Optional: keep parent_name updated
        await supabase
          .from('parents')
          .update({ parent_name: parentName.trim() })
          .eq('id', parentId)
      } else {
        const { data: newParent, error: parentInsertError } = await supabase
          .from('parents')
          .insert({
            parent_name: parentName.trim(),
            email: email.trim()
          })
          .select('id')
          .single()

        if (parentInsertError) throw parentInsertError
        parentId = newParent.id
      }

      // 2) Upsert children by (parent_id, name)
      const childrenPayload = children
        .filter((child) => child.name.trim() !== '')
        .map((child) => ({
          parent_id: parentId,
          name: child.name.trim(),
          age_value: child.age_value ? Number(child.age_value) : null,
          age_unit: child.age_unit,
        }))

      if (childrenPayload.length === 0) {
        setMessage('Add at least one child name')
        return
      }

      const { data: upsertedChildren, error: childrenError } = await supabase
        .from('children')
        .upsert(childrenPayload, {
          onConflict: 'parent_id,name'
        })
        .select('id,name')

      if (childrenError) throw childrenError

      // 3) For each child, replace interest mapping
      for (let i = 0; i < upsertedChildren.length; i++) {
        const savedChild = upsertedChildren[i]
        const formChild = children.find(
          (c) => c.name.trim().toLowerCase() === savedChild.name.toLowerCase()
        )

        if (!formChild) continue

        const interestName =
          formChild.interest === 'others'
            ? formChild.otherInterest.trim()
            : formChild.interest.trim()

        // Clear old mappings first, so update works cleanly
        const { error: deleteMapError } = await supabase
          .from('child_interests')
          .delete()
          .eq('child_id', savedChild.id)

        if (deleteMapError) throw deleteMapError

        if (!interestName) continue

        // Find or create interest
        let { data: interest, error: interestLookupError } = await supabase
          .from('interests')
          .select('id,name')
          .eq('name', interestName)
          .maybeSingle()

        if (interestLookupError) throw interestLookupError

        if (!interest) {
          const { data: newInterest, error: interestInsertError } = await supabase
            .from('interests')
            .insert({ name: interestName })
            .select('id,name')
            .single()

          if (interestInsertError) throw interestInsertError
          interest = newInterest
        }

        const { error: mapInsertError } = await supabase
          .from('child_interests')
          .insert({
            child_id: savedChild.id,
            interest_id: interest.id
          })

        if (mapInsertError) throw mapInsertError
      }

      setMessage('🎉 Saved successfully!')

      setParentName('')
      setEmail('')
      setChildren([
        { name: '', age_value: '', age_unit: 'years', interest: '', otherInterest: '' }
      ])
    } catch (err: any) {
      console.error(err)
      setMessage('❌ Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5">
        <h1 className="text-3xl font-semibold text-center">The Kiddle 🧸</h1>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Parent Name"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <div className="space-y-4">
          {children.map((child, index) => (
            <div
              key={index}
              className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
            >
              {children.length > 1 && (
                <button
                  onClick={() => removeChild(index)}
                  className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700"
                >
                  ✕ Remove
                </button>
              )}

              <input
                type="text"
                placeholder="Child Name"
                value={child.name}
                onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md"
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Age"
                  value={child.age_value}
                  onChange={(e) => handleChildChange(index, 'age_value', e.target.value)}
                  className="w-2/3 border border-gray-300 p-2 rounded-md"
                />

                <select
                  value={child.age_unit}
                  onChange={(e) => handleChildChange(index, 'age_unit', e.target.value)}
                  className="w-1/3 border border-gray-300 p-2 rounded-md"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>

              <select
                value={child.interest}
                onChange={(e) => handleChildChange(index, 'interest', e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-md"
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
                  type="text"
                  placeholder="Custom interest"
                  value={child.otherInterest}
                  onChange={(e) => handleChildChange(index, 'otherInterest', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md"
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addChild}
          className="w-full border border-dashed border-gray-400 text-gray-600 p-3 rounded-lg hover:bg-gray-100 transition"
        >
          + Add Child
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 transition text-white p-3 rounded-lg font-medium"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  )
}