'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('subscribers')
      .insert([{ email }])

    if (error) {
      setMessage('Already subscribed or error occurred.')
    } else {
      setMessage('🎉 Subscribed successfully!')
      setEmail('')
    }
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">The Kiddle 🧸</h1>
      <p className="mt-2">Fun weekend content for kids, delivered to parents.</p>

      <form onSubmit={handleSubmit} className="mt-6">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded w-64"
        />
        <br /><br />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Subscribe
        </button>
      </form>

      <p className="mt-4">{message}</p>
    </main>
  )
}